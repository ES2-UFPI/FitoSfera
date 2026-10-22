import {
  FalhaNoPareamento,
  PareamentoDoSensor,
  SensorEncontrado,
  SensorPareado,
} from '@/aplicacao/portas/PareamentoDoSensor';
import { EstadoDaConexao } from '@/dominio/modelos/EstadoDaConexao';
import { Leitura } from '@/dominio/modelos/Leitura';
import { Relogio } from '@/dominio/portas/Relogio';
import { CancelarObservacao, SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { ClienteBle, ConexaoBle } from './ClienteBle';
import { CONTRATO_DO_SENSOR } from './ContratoDoSensor';
import { decodificarPacote } from './DecodificadorDoPacote';

/** Onde fica o sensor escolhido, para o app reconectar sozinho quando for reaberto. */
export interface GuardaDoSensorPareado {
  obter(): Promise<SensorPareado | null>;
  salvar(sensor: SensorPareado): Promise<void>;
  esquecer(): Promise<void>;
}

export const ESPERA_PARA_RECONECTAR_MS = 10_000;

/**
 * O sensor físico do firmware em `firmware/`, por BLE. Conecta ao sensor pareado na primeira vez que alguém
 * pede uma leitura, e tenta de novo a cada `ESPERA_PARA_RECONECTAR_MS` enquanto a ligação estiver caída.
 * O firmware não tem relógio: a hora da leitura é a hora em que o pacote chega.
 */
export class SensorBluetooth implements SensorDeAmbiente, PareamentoDoSensor {
  private pareado: SensorPareado | null = null;
  private conexao: ConexaoBle | null = null;
  private estado: EstadoDaConexao = 'indisponivel';
  private ultimaLeitura: Leitura | null = null;
  private inicio: Promise<void> | null = null;
  private reconexao: ReturnType<typeof setTimeout> | null = null;
  private encerrarConexao: (() => void) | null = null;
  private readonly observadores = new Set<(leitura: Leitura) => void>();
  private readonly esperas = new Set<(leitura: Leitura) => void>();

  constructor(
    private readonly cliente: ClienteBle,
    private readonly guarda: GuardaDoSensorPareado,
    private readonly relogio: Relogio,
  ) {}

  async lerLeituraAtual(): Promise<Leitura | null> {
    this.garantirInicio();
    return this.ultimaLeitura;
  }

  observarLeituras(aoReceber: (leitura: Leitura) => void): CancelarObservacao {
    this.garantirInicio();
    const observador = (leitura: Leitura) => aoReceber(leitura);
    this.observadores.add(observador);
    return () => this.observadores.delete(observador);
  }

  async consultarEstadoDaConexao(): Promise<EstadoDaConexao> {
    await this.garantirInicio();
    return this.estado;
  }

  pedirPermissoes(): Promise<boolean> {
    return this.cliente.pedirPermissoes();
  }

  procurar(aoEncontrar: (sensor: SensorEncontrado) => void, aoFalhar: (falha: FalhaNoPareamento) => void): () => void {
    let cancelada = false;
    let pararBusca: (() => void) | null = null;
    void this.cliente.consultarEstado().then((estado) => {
      if (cancelada) return;
      if (estado === 'desligado') {
        aoFalhar(new FalhaNoPareamento('bluetooth-desligado'));
        return;
      }
      pararBusca = this.cliente.procurar(
        (dispositivo) =>
          aoEncontrar({
            id: dispositivo.id,
            nome: dispositivo.nome ?? CONTRATO_DO_SENSOR.nome,
            intensidadeDoSinal: dispositivo.rssi,
          }),
        () => aoFalhar(new FalhaNoPareamento('falha-na-busca')),
      );
    });
    return () => {
      cancelada = true;
      pararBusca?.();
    };
  }

  async parear(sensor: SensorPareado): Promise<Leitura> {
    await this.garantirInicio();
    this.cancelarReconexao();
    await this.desconectar();

    const primeiraLeitura = this.esperarLeitura();
    try {
      await this.conectar(sensor.id);
    } catch {
      primeiraLeitura.cancelar();
      this.agendarReconexao();
      throw new FalhaNoPareamento('falha-na-conexao');
    }

    const leitura = await primeiraLeitura.promessa;
    if (leitura === null) {
      await this.desconectar();
      this.agendarReconexao();
      throw new FalhaNoPareamento('sem-leitura');
    }
    this.pareado = sensor;
    await this.guarda.salvar(sensor);
    return leitura;
  }

  async obterPareado(): Promise<SensorPareado | null> {
    await this.garantirInicio();
    return this.pareado;
  }

  async esquecer(): Promise<void> {
    await this.garantirInicio();
    this.pareado = null;
    this.cancelarReconexao();
    await this.desconectar();
    await this.guarda.esquecer();
    this.ultimaLeitura = null;
    this.estado = 'indisponivel';
  }

  private garantirInicio(): Promise<void> {
    this.inicio ??= this.guarda.obter().then(
      (pareado) => {
        this.pareado = pareado;
        if (pareado !== null) void this.conectarAoPareado();
      },
      () => undefined,
    );
    return this.inicio;
  }

  private async conectarAoPareado(): Promise<void> {
    const pareado = this.pareado;
    if (pareado === null || this.conexao !== null) return;
    try {
      await this.conectar(pareado.id);
    } catch {
      this.agendarReconexao();
    }
  }

  private async conectar(id: string): Promise<void> {
    this.estado = 'conectando';
    let conexao: ConexaoBle;
    try {
      conexao = await this.cliente.conectar(id);
    } catch (erro) {
      this.estado = this.pareado === null ? 'indisponivel' : 'desconectado';
      throw erro;
    }
    this.conexao = conexao;
    this.estado = 'conectado';

    const pararDeMonitorar = conexao.monitorar((valor) => this.receber(valor));
    const pararDeVigiar = conexao.aoCair(() => {
      if (this.conexao !== conexao) return;
      this.encerrarConexao?.();
      this.conexao = null;
      this.estado = 'desconectado';
      this.agendarReconexao();
    });
    this.encerrarConexao = () => {
      pararDeMonitorar();
      pararDeVigiar();
      this.encerrarConexao = null;
    };

    // O valor lido pode ter até 60 s; o pedido traz um fresco, que chega por notificação.
    this.receber(await conexao.ler().catch(() => null));
    await conexao.pedirLeitura().catch(() => undefined);
  }

  private receber(valor: string | null): void {
    const pacote = decodificarPacote(valor);
    if (pacote === null) return;
    const leitura: Leitura = { ...pacote, medidaEm: this.relogio.agora() };
    this.ultimaLeitura = leitura;
    this.esperas.forEach((resolver) => resolver(leitura));
    this.observadores.forEach((observador) => observador(leitura));
  }

  private esperarLeitura(): { promessa: Promise<Leitura | null>; cancelar(): void } {
    let concluir: (leitura: Leitura | null) => void = () => undefined;
    const promessa = new Promise<Leitura | null>((resolver) => {
      const limite = setTimeout(() => concluir(null), CONTRATO_DO_SENSOR.tempoLimiteDaLeituraMs);
      concluir = (leitura) => {
        clearTimeout(limite);
        this.esperas.delete(concluir);
        resolver(leitura);
      };
      this.esperas.add(concluir);
    });
    return { promessa, cancelar: () => concluir(null) };
  }

  private agendarReconexao(): void {
    if (this.pareado === null || this.reconexao !== null) return;
    this.reconexao = setTimeout(() => {
      this.reconexao = null;
      void this.conectarAoPareado();
    }, ESPERA_PARA_RECONECTAR_MS);
  }

  private cancelarReconexao(): void {
    if (this.reconexao !== null) clearTimeout(this.reconexao);
    this.reconexao = null;
  }

  private async desconectar(): Promise<void> {
    const conexao = this.conexao;
    this.encerrarConexao?.();
    this.conexao = null;
    if (conexao !== null) await conexao.desconectar().catch(() => undefined);
    this.estado = this.pareado === null ? 'indisponivel' : 'desconectado';
  }
}

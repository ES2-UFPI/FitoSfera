import {
  FalhaNoPareamento,
  MotivoDaFalhaDoPareamento,
  PareamentoDoSensor,
  SensorEncontrado,
  SensorPareado,
} from '@/aplicacao/portas/PareamentoDoSensor';
import { ConexaoDoSensor, EstadoDaConexao, ProblemaDaConexao } from '@/dominio/modelos/EstadoDaConexao';
import { Leitura } from '@/dominio/modelos/Leitura';
import { Relogio } from '@/dominio/portas/Relogio';
import { CancelarObservacao, SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { ClienteBle, ConexaoBle, TipoDaFalhaBle, tipoDaFalha } from './ClienteBle';
import { CONTRATO_DO_SENSOR } from './ContratoDoSensor';
import { decodificarPacote } from './DecodificadorDoPacote';

/** Onde fica o sensor escolhido, para o app reconectar sozinho quando for reaberto. */
export interface GuardaDoSensorPareado {
  obter(): Promise<SensorPareado | null>;
  salvar(sensor: SensorPareado): Promise<void>;
  esquecer(): Promise<void>;
}

/** A primeira nova tentativa sai logo; as seguintes esperam o dobro da anterior, até o teto. */
export const ESPERA_INICIAL_PARA_RECONECTAR_MS = 5_000;
export const ESPERA_MAXIMA_PARA_RECONECTAR_MS = 60_000;

/**
 * Quanto esperar antes da tentativa de número `tentativa` (a partir de 0): 5 s, 10 s, 20 s, 40 s e, dali em
 * diante, 60 s. Com o sensor longe por muito tempo, o app não gasta bateria tentando a cada poucos segundos.
 */
export function esperaParaReconectar(tentativa: number): number {
  return Math.min(ESPERA_INICIAL_PARA_RECONECTAR_MS * 2 ** tentativa, ESPERA_MAXIMA_PARA_RECONECTAR_MS);
}

/** O que a conexão sabe dizer à pessoa quando cai ou não abre. */
const PROBLEMA_DA_FALHA: Record<TipoDaFalhaBle, ProblemaDaConexao> = {
  'bluetooth-desligado': 'bluetooth-desligado',
  // Sem permissão tem estado próprio (`sem-permissao`); aqui só entra se a permissão cair no meio da conexão.
  'sem-permissao': 'fora-de-alcance',
  'tempo-esgotado': 'tempo-esgotado',
  'fora-de-alcance': 'fora-de-alcance',
  'falha-na-leitura': 'falha-na-leitura',
  desconhecido: 'fora-de-alcance',
};

const MOTIVO_DA_FALHA_AO_PAREAR: Record<TipoDaFalhaBle, MotivoDaFalhaDoPareamento> = {
  'bluetooth-desligado': 'bluetooth-desligado',
  'sem-permissao': 'permissao-negada',
  'tempo-esgotado': 'tempo-esgotado',
  'fora-de-alcance': 'fora-de-alcance',
  'falha-na-leitura': 'falha-na-leitura',
  desconhecido: 'falha-na-conexao',
};

const MOTIVO_DA_FALHA_NA_BUSCA: Partial<Record<TipoDaFalhaBle, MotivoDaFalhaDoPareamento>> = {
  'bluetooth-desligado': 'bluetooth-desligado',
  'sem-permissao': 'permissao-negada',
};

/**
 * O sensor físico do firmware em `firmware/`, por BLE. Conecta ao sensor pareado na primeira vez que alguém
 * pede uma leitura e, enquanto a ligação estiver caída, tenta de novo com espera crescente
 * (`esperaParaReconectar`). Religar o Bluetooth do celular reconecta na hora.
 * O firmware não tem relógio: a hora da leitura é a hora em que o pacote chega.
 */
export class SensorBluetooth implements SensorDeAmbiente, PareamentoDoSensor {
  private pareado: SensorPareado | null = null;
  private conexao: ConexaoBle | null = null;
  private estado: EstadoDaConexao = 'indisponivel';
  private problema: ProblemaDaConexao | null = null;
  private proximaTentativa: Date | null = null;
  private tentativas = 0;
  private ultimaLeitura: Leitura | null = null;
  private ultimaComunicacao: Date | null = null;
  private inicio: Promise<void> | null = null;
  private reconexao: ReturnType<typeof setTimeout> | null = null;
  private encerrarConexao: (() => void) | null = null;
  private readonly observadores = new Set<(leitura: Leitura) => void>();
  private readonly esperas = new Set<(leitura: Leitura) => void>();
  private readonly observadoresDaConexao = new Set<(conexao: ConexaoDoSensor) => void>();

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

  observarConexao(aoMudar: (conexao: ConexaoDoSensor) => void): CancelarObservacao {
    void this.garantirInicio();
    const observador = (conexao: ConexaoDoSensor) => aoMudar(conexao);
    this.observadoresDaConexao.add(observador);
    observador(this.conexaoAtual());
    return () => this.observadoresDaConexao.delete(observador);
  }

  async pedirPermissoes(): Promise<boolean> {
    const permitido = await this.cliente.pedirPermissoes();
    // Quem estava parado por falta de permissão volta a tentar na hora, sem esperar a próxima tentativa.
    if (permitido && this.estado === 'sem-permissao') this.reconectarAgora();
    return permitido;
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
        (erro) => aoFalhar(new FalhaNoPareamento(MOTIVO_DA_FALHA_NA_BUSCA[erro.tipo] ?? 'falha-na-busca')),
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

    // Sem isto, a biblioteca só responderia depois do tempo limite da conexão, com um motivo menos claro.
    if ((await this.cliente.consultarEstado().catch(() => 'desconhecido')) === 'desligado') {
      this.agendarReconexao();
      throw new FalhaNoPareamento('bluetooth-desligado');
    }

    const primeiraLeitura = this.esperarLeitura();
    try {
      await this.conectar(sensor.id);
    } catch (erro) {
      primeiraLeitura.cancelar();
      this.agendarReconexao();
      throw new FalhaNoPareamento(MOTIVO_DA_FALHA_AO_PAREAR[tipoDaFalha(erro)]);
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
    this.ultimaComunicacao = null;
    this.atualizar({ estado: 'indisponivel', problema: null });
  }

  private garantirInicio(): Promise<void> {
    this.inicio ??= this.guarda.obter().then(
      (pareado) => {
        this.pareado = pareado;
        this.vigiarBluetooth();
        if (pareado !== null) void this.conectarAoPareado();
      },
      () => undefined,
    );
    return this.inicio;
  }

  /** Bluetooth religado: não faz sentido esperar a próxima tentativa agendada. */
  private vigiarBluetooth(): void {
    this.cliente.observarEstado((estado) => {
      if (estado === 'ligado' && this.conexao === null && this.problema === 'bluetooth-desligado') {
        this.reconectarAgora();
      } else if (estado === 'desligado' && this.conexao === null && this.pareado !== null) {
        this.atualizar({ estado: 'desconectado', problema: 'bluetooth-desligado' });
      }
    });
  }

  private reconectarAgora(): void {
    this.cancelarReconexao();
    this.tentativas = 0;
    void this.conectarAoPareado();
  }

  private async conectarAoPareado(): Promise<void> {
    const pareado = this.pareado;
    if (pareado === null || this.conexao !== null) return;
    if (!(await this.cliente.temPermissoes().catch(() => false))) {
      this.atualizar({ estado: 'sem-permissao', problema: null });
      this.agendarReconexao();
      return;
    }
    if ((await this.cliente.consultarEstado().catch(() => 'desconhecido')) === 'desligado') {
      this.atualizar({ estado: 'desconectado', problema: 'bluetooth-desligado' });
      this.agendarReconexao();
      return;
    }
    try {
      await this.conectar(pareado.id);
    } catch {
      this.agendarReconexao();
    }
  }

  private async conectar(id: string): Promise<void> {
    this.atualizar({ estado: 'conectando', problema: null });
    let conexao: ConexaoBle;
    try {
      conexao = await this.cliente.conectar(id);
    } catch (erro) {
      this.atualizar(
        this.pareado === null
          ? { estado: 'indisponivel', problema: null }
          : { estado: 'desconectado', problema: PROBLEMA_DA_FALHA[tipoDaFalha(erro)] },
      );
      throw erro;
    }
    this.conexao = conexao;
    this.tentativas = 0;
    this.atualizar({ estado: 'conectado', problema: null });

    const pararDeMonitorar = conexao.monitorar((valor) => this.receber(valor));
    const pararDeVigiar = conexao.aoCair(() => {
      if (this.conexao !== conexao) return;
      this.encerrarConexao?.();
      this.conexao = null;
      void this.aoPerderConexao();
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

  /** A queda não diz o motivo: o Bluetooth desligado explica; fora isso, o sensor saiu de alcance. */
  private async aoPerderConexao(): Promise<void> {
    this.atualizar({ estado: 'desconectado', problema: 'fora-de-alcance' });
    this.agendarReconexao();
    if ((await this.cliente.consultarEstado().catch(() => 'desconhecido')) === 'desligado' && this.conexao === null) {
      this.atualizar({ problema: 'bluetooth-desligado' });
    }
  }

  private receber(valor: string | null): void {
    const pacote = decodificarPacote(valor);
    if (pacote === null) return;
    const leitura: Leitura = { ...pacote, medidaEm: this.relogio.agora() };
    this.ultimaLeitura = leitura;
    this.ultimaComunicacao = leitura.medidaEm;
    this.esperas.forEach((resolver) => resolver(leitura));
    this.observadores.forEach((observador) => observador(leitura));
  }

  /** Muda o que for informado e avisa os observadores só quando algo mudou de fato. */
  private atualizar(mudanca: {
    estado?: EstadoDaConexao;
    problema?: ProblemaDaConexao | null;
    proximaTentativa?: Date | null;
  }): void {
    const estado = mudanca.estado ?? this.estado;
    const problema = mudanca.problema === undefined ? this.problema : mudanca.problema;
    const proximaTentativa = mudanca.proximaTentativa === undefined ? this.proximaTentativa : mudanca.proximaTentativa;
    if (
      estado === this.estado &&
      problema === this.problema &&
      proximaTentativa?.getTime() === this.proximaTentativa?.getTime()
    )
      return;
    this.estado = estado;
    this.problema = problema;
    this.proximaTentativa = proximaTentativa;
    const conexao = this.conexaoAtual();
    this.observadoresDaConexao.forEach((observador) => observador(conexao));
  }

  private conexaoAtual(): ConexaoDoSensor {
    const conexao: { -readonly [Campo in keyof ConexaoDoSensor]: ConexaoDoSensor[Campo] } = {
      estado: this.estado,
      ultimaComunicacao: this.ultimaComunicacao,
    };
    if (this.estado === 'desconectado' && this.problema !== null) conexao.problema = this.problema;
    if (this.proximaTentativa !== null) conexao.proximaTentativa = this.proximaTentativa;
    return conexao;
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
    const espera = esperaParaReconectar(this.tentativas);
    this.tentativas += 1;
    this.reconexao = setTimeout(() => {
      this.reconexao = null;
      this.atualizar({ proximaTentativa: null });
      void this.conectarAoPareado();
    }, espera);
    this.atualizar({ proximaTentativa: new Date(this.relogio.agora().getTime() + espera) });
  }

  private cancelarReconexao(): void {
    if (this.reconexao !== null) clearTimeout(this.reconexao);
    this.reconexao = null;
    this.atualizar({ proximaTentativa: null });
  }

  private async desconectar(): Promise<void> {
    const conexao = this.conexao;
    this.encerrarConexao?.();
    this.conexao = null;
    if (conexao !== null) await conexao.desconectar().catch(() => undefined);
    this.atualizar({ estado: this.pareado === null ? 'indisponivel' : 'desconectado', problema: null });
  }
}

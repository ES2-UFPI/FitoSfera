import { PareamentoDoSensor, SensorEncontrado, SensorPareado, FalhaNoPareamento } from '@/aplicacao/portas/PareamentoDoSensor';
import { Relogio } from '@/dominio/portas/Relogio';
import { Leitura } from '@/dominio/modelos/Leitura';
import { ConexaoDoSensor, EstadoDaConexao } from '@/dominio/modelos/EstadoDaConexao';
import { CancelarObservacao, SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { RepositorioDeSensoresPareadosAsyncStorage } from '../persistencia/RepositorioDeSensoresPareadosAsyncStorage';
import { ClienteBle } from './ClienteBle';
import { SensorBluetooth } from './SensorBluetooth';

/** Mantém uma conexão independente por dispositivo, compartilhando o cliente BLE e a busca. */
export class CentralDeSensoresBluetooth implements PareamentoDoSensor, SensorDeAmbiente {
  private readonly dispositivos = new Map<string, SensorBluetooth>();
  private readonly scanner: SensorBluetooth;
  private ultimoPareado: string | null = null;

  constructor(private readonly cliente: ClienteBle, private readonly guarda: RepositorioDeSensoresPareadosAsyncStorage,
    private readonly relogio: Relogio) {
    this.scanner = new SensorBluetooth(cliente, {
      obter: async () => null, salvar: async () => undefined, esquecer: async () => undefined,
    }, relogio);
  }

  pedirPermissoes(): Promise<boolean> { return this.scanner.pedirPermissoes(); }

  async lerLeituraAtual(): Promise<Leitura | null> {
    const sensor = await this.obterPareado();
    return sensor ? this.obterSensor(sensor.id).lerLeituraAtual() : null;
  }

  observarLeituras(aoReceber: (leitura: Leitura) => void): CancelarObservacao {
    return this.observarAtual((sensor) => sensor.observarLeituras(aoReceber));
  }

  async consultarEstadoDaConexao(): Promise<EstadoDaConexao> {
    const sensor = await this.obterPareado();
    return sensor ? this.obterSensor(sensor.id).consultarEstadoDaConexao() : 'indisponivel';
  }

  observarConexao(aoMudar: (conexao: ConexaoDoSensor) => void): CancelarObservacao {
    return this.observarAtual((sensor) => sensor.observarConexao(aoMudar));
  }

  private observarAtual(inscrever: (sensor: SensorBluetooth) => CancelarObservacao): CancelarObservacao {
    let ativo = true;
    let cancelar: CancelarObservacao | null = null;
    void this.obterPareado().then((sensor) => {
      if (ativo && sensor) cancelar = inscrever(this.obterSensor(sensor.id));
    });
    return () => { ativo = false; cancelar?.(); };
  }

  procurar(aoEncontrar: (sensor: SensorEncontrado) => void, aoFalhar: (falha: FalhaNoPareamento) => void): () => void {
    return this.scanner.procurar(aoEncontrar, aoFalhar);
  }

  async parear(sensor: SensorPareado) {
    const leitura = await this.obterSensor(sensor.id).parear(sensor);
    this.ultimoPareado = sensor.id;
    return leitura;
  }

  listarPareados(): Promise<readonly SensorPareado[]> { return this.guarda.listar(); }

  async obterPareado(): Promise<SensorPareado | null> {
    const lista = await this.guarda.listar();
    return lista.find((sensor) => sensor.id === this.ultimoPareado) ?? lista[lista.length - 1] ?? null;
  }

  async esquecer(id?: string): Promise<void> {
    const escolhido = id ?? (await this.obterPareado())?.id;
    if (!escolhido) return;
    const instancia = this.dispositivos.get(escolhido);
    if (instancia) await instancia.esquecer();
    else await this.guarda.esquecer(escolhido);
    this.dispositivos.delete(escolhido);
    if (this.ultimoPareado === escolhido) this.ultimoPareado = null;
  }

  obterSensor(id: string): SensorBluetooth {
    let instancia = this.dispositivos.get(id);
    if (!instancia) {
      instancia = new SensorBluetooth(this.cliente, {
        obter: async () => (await this.guarda.listar()).find((sensor) => sensor.id === id) ?? null,
        salvar: (sensor) => this.guarda.salvar(sensor),
        esquecer: () => this.guarda.esquecer(id),
      }, this.relogio);
      this.dispositivos.set(id, instancia);
    }
    return instancia;
  }
}

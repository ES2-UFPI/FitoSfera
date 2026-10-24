import { AcompanharConexaoDoSensor } from '@/aplicacao/casos-de-uso/AcompanharConexaoDoSensor';
import { AvaliarLeitura } from '@/aplicacao/casos-de-uso/AvaliarLeitura';
import { CadastrarPlanta } from '@/aplicacao/casos-de-uso/CadastrarPlanta';
import { EditarPlanta } from '@/aplicacao/casos-de-uso/EditarPlanta';
import { ExcluirPlanta } from '@/aplicacao/casos-de-uso/ExcluirPlanta';
import { ListarJardimVirtual } from '@/aplicacao/casos-de-uso/ListarJardimVirtual';
import { ListarRegasDaPlanta } from '@/aplicacao/casos-de-uso/ListarRegasDaPlanta';
import { ObterPlantaDoJardim } from '@/aplicacao/casos-de-uso/ObterPlantaDoJardim';
import { ObterHistoricoDaPlanta } from '@/aplicacao/casos-de-uso/ObterHistoricoDaPlanta';
import { ObterLeituraAtual } from '@/aplicacao/casos-de-uso/ObterLeituraAtual';
import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';
import { RegistrarRega } from '@/aplicacao/casos-de-uso/RegistrarRega';
import { GerenciarJardins } from '@/aplicacao/casos-de-uso/GerenciarJardins';
import { ControleDoSensorDeDesenvolvimento } from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { PareamentoDoSensor } from '@/aplicacao/portas/PareamentoDoSensor';
import { Container } from '@/composicao/Container';
import { Aparencia, APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { FaixasRecomendadas } from '@/dominio/modelos/FaixaRecomendada';
import { ConexaoDoSensor, EstadoDaConexao } from '@/dominio/modelos/EstadoDaConexao';
import { Leitura } from '@/dominio/modelos/Leitura';
import { Planta } from '@/dominio/modelos/Planta';
import { Jardim, JARDIM_PRINCIPAL } from '@/dominio/modelos/Jardim';
import { Rega } from '@/dominio/modelos/Rega';
import { Aviso, Notificador } from '@/dominio/portas/Notificador';
import { RepositorioDeAvisos } from '@/dominio/portas/RepositorioDeAvisos';
import { CancelarObservacao, SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { GeradorDeIdentificador } from '@/dominio/portas/GeradorDeIdentificador';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';
import { RepositorioDeRegas } from '@/dominio/portas/RepositorioDeRegas';
import { RepositorioDeJardins } from '@/dominio/portas/RepositorioDeJardins';
import { RepositorioDeEspeciesLocal } from '@/infraestrutura/catalogo/RepositorioDeEspeciesLocal';
import { ESPECIES_DE_TESTE, FAIXAS_DE_TESTE } from './especiesDeTeste';

export class RepositorioDePlantasEmMemoria implements RepositorioDePlantas {
  readonly salvas: Planta[];

  constructor(iniciais: Planta[] = []) {
    this.salvas = [...iniciais];
  }

  async listar() {
    return [...this.salvas];
  }

  async obterPorId(id: string) {
    return this.salvas.find((planta) => planta.id === id) ?? null;
  }

  async adicionar(planta: Planta) {
    this.salvas.push(planta);
  }

  async atualizar(planta: Planta) {
    const posicao = this.salvas.findIndex((salva) => salva.id === planta.id);
    if (posicao >= 0) this.salvas[posicao] = planta;
  }

  async remover(id: string) {
    const posicao = this.salvas.findIndex((planta) => planta.id === id);
    if (posicao >= 0) this.salvas.splice(posicao, 1);
  }
}

export class RepositorioDeJardinsEmMemoria implements RepositorioDeJardins {
  jardins: Jardim[];
  selecionado = JARDIM_PRINCIPAL.id;

  constructor(iniciais: readonly Jardim[] = [JARDIM_PRINCIPAL]) { this.jardins = [...iniciais]; }

  async listar(): Promise<readonly Jardim[]> { return [...this.jardins]; }
  async obterSelecionado(): Promise<string> { return this.selecionado; }
  async salvar(jardim: Jardim): Promise<void> {
    this.jardins = [...this.jardins.filter((item) => item.id !== jardim.id), jardim];
  }
  async selecionar(id: string): Promise<void> {
    if (!this.jardins.some((item) => item.id === id)) throw new Error('Jardim não encontrado.');
    this.selecionado = id;
  }
}

export class RepositorioDeRegasEmMemoria implements RepositorioDeRegas {
  readonly salvas: Rega[] = [];

  constructor(
    private readonly falharAoGravar = false,
    iniciais: readonly Rega[] = [],
  ) {
    this.salvas.push(...iniciais);
  }

  async gravar(rega: Rega) {
    if (this.falharAoGravar) throw new Error('armazenamento indisponível');
    this.salvas.push(rega);
  }

  async listarPorPlanta(idPlanta: string) {
    return this.salvas
      .filter((rega) => rega.idPlanta === idPlanta)
      .sort((a, b) => b.regadaEm.getTime() - a.regadaEm.getTime());
  }

  async apagarDaPlanta(idPlanta: string) {
    this.salvas.splice(0, this.salvas.length, ...this.salvas.filter((rega) => rega.idPlanta !== idPlanta));
  }
}

/** Simula o armazenamento do aparelho recusando a leitura. */
export class RepositorioQueFalhaAoLer extends RepositorioDePlantasEmMemoria {
  async listar(): Promise<Planta[]> {
    throw new Error('armazenamento indisponível');
  }

  async obterPorId(): Promise<Planta | null> {
    throw new Error('armazenamento indisponível');
  }
}
/** Simula o armazenamento do aparelho recusando a gravação de uma planta nova. */
export class RepositorioQueFalhaAoGravar extends RepositorioDePlantasEmMemoria {
  async adicionar(): Promise<void> {
    throw new Error('armazenamento indisponível');
  }
}

/** Sensor de mentira: devolve a leitura combinada, nenhuma, ou falha. */
export class SensorFixo implements SensorDeAmbiente {
  private readonly observadores = new Set<(leitura: Leitura) => void>();
  falharAoLerAtual = false;

  constructor(private readonly leitura: Leitura | null | 'falha' = null) {}

  async lerLeituraAtual(): Promise<Leitura | null> {
    if (this.leitura === 'falha' || this.falharAoLerAtual) throw new Error('sensor fora do ar');
    return this.leitura;
  }

  observarLeituras(aoReceber: (leitura: Leitura) => void): CancelarObservacao {
    this.observadores.add(aoReceber);
    return () => this.observadores.delete(aoReceber);
  }

  publicar(leitura: Leitura): void {
    this.observadores.forEach((observador) => observador(leitura));
  }

  get quantidadeDeObservadores(): number {
    return this.observadores.size;
  }

  async consultarEstadoDaConexao(): Promise<EstadoDaConexao> {
    return this.conexaoAtual().estado;
  }

  private conexao: ConexaoDoSensor | null = null;
  private readonly observadoresDaConexao = new Set<(conexao: ConexaoDoSensor) => void>();

  observarConexao(aoMudar: (conexao: ConexaoDoSensor) => void): CancelarObservacao {
    this.observadoresDaConexao.add(aoMudar);
    aoMudar(this.conexaoAtual());
    return () => this.observadoresDaConexao.delete(aoMudar);
  }

  private conexaoAtual(): ConexaoDoSensor {
    if (this.conexao !== null) return this.conexao;
    if (this.leitura === 'falha') return { estado: 'desconectado', ultimaComunicacao: null };
    if (this.leitura === null) return { estado: 'indisponivel', ultimaComunicacao: null };
    return { estado: 'conectado', ultimaComunicacao: this.leitura.medidaEm };
  }

  mudarConexao(conexao: ConexaoDoSensor): void {
    this.conexao = conexao;
    this.observadoresDaConexao.forEach((observador) => observador(conexao));
  }
}

/** Notificador de mentira: conta os pedidos de permissão e guarda os avisos entregues. */
export class NotificadorFalso implements Notificador {
  readonly entregues: Aviso[] = [];
  pedidosDePermissao = 0;

  constructor(
    private readonly permitido = true,
    private readonly falharAoNotificar = false,
  ) {}

  async garantirPermissao(): Promise<boolean> {
    this.pedidosDePermissao += 1;
    return this.permitido;
  }

  async notificar(aviso: Aviso): Promise<void> {
    if (this.falharAoNotificar) throw new Error('o sistema recusou a notificação');
    this.entregues.push(aviso);
  }
}

export class RepositorioDeAvisosEmMemoria implements RepositorioDeAvisos {
  salvas: ReadonlyMap<string, string>;

  constructor(iniciais: ReadonlyMap<string, string> = new Map()) {
    this.salvas = new Map(iniciais);
  }

  async listar(): Promise<ReadonlyMap<string, string>> {
    return new Map(this.salvas);
  }

  async gravar(assinaturas: ReadonlyMap<string, string>): Promise<void> {
    this.salvas = new Map(assinaturas);
  }
}

export class RelogioParado implements Relogio {
  constructor(private readonly instante: Date = new Date(2026, 9, 17, 14, 0)) {}

  agora(): Date {
    return this.instante;
  }
}

export class GeradorSequencial implements GeradorDeIdentificador {
  private proximo = 1;

  gerar() {
    return `p${this.proximo++}`;
  }
}

export function plantaDeTeste(
  parcial: Partial<{
    id: string;
    idJardim: string;
    idEspecie: string;
    apelido: string;
    aparencia: Aparencia;
    faixasRecomendadas: FaixasRecomendadas | null;
    cadastradaEm: Date | null;
  }> = {},
): Planta {
  return Planta.criar({
    id: 'p1',
    idEspecie: 'tomate',
    apelido: 'Tomatinho',
    aparencia: APARENCIA_INICIAL,
    faixasRecomendadas: FAIXAS_DE_TESTE,
    ...parcial,
  });
}

export function criarContainerDeTeste(
  opcoes: {
    plantas?: Planta[];
    jardins?: Jardim[];
    especies?: readonly EspecieVegetal[];
    falharAoLer?: boolean;
    falhaAoCadastrar?: boolean;
    leitura?: Leitura | null | 'falha';
    sensor?: SensorDeAmbiente;
    agora?: Date;
    falharAoRegistrarRega?: boolean;
    regas?: readonly Rega[];
    controleDoSensorDeDesenvolvimento?: ControleDoSensorDeDesenvolvimento | null;
    pareamentoDoSensor?: PareamentoDoSensor | null;
    permitirNotificacao?: boolean;
  } = {},
): {
  container: Container;
  plantas: RepositorioDePlantasEmMemoria;
  regas: RepositorioDeRegasEmMemoria;
  notificador: NotificadorFalso;
  avisos: RepositorioDeAvisosEmMemoria;
} {
  const plantas = opcoes.falharAoLer
    ? new RepositorioQueFalhaAoLer(opcoes.plantas)
    : opcoes.falhaAoCadastrar
      ? new RepositorioQueFalhaAoGravar(opcoes.plantas)
      : new RepositorioDePlantasEmMemoria(opcoes.plantas);
  const especies = new RepositorioDeEspeciesLocal(opcoes.especies ?? ESPECIES_DE_TESTE);
  const leituras = opcoes.sensor ?? new SensorFixo(opcoes.leitura ?? null);
  const relogio = new RelogioParado(opcoes.agora);
  const gerador = new GeradorSequencial();
  const regas = new RepositorioDeRegasEmMemoria(opcoes.falharAoRegistrarRega, opcoes.regas);
  const notificador = new NotificadorFalso(opcoes.permitirNotificacao ?? false);
  const avisos = new RepositorioDeAvisosEmMemoria();
  const container: Container = {
    gerenciarJardins: new GerenciarJardins(new RepositorioDeJardinsEmMemoria(opcoes.jardins), gerador),
    listarJardim: new ListarJardimVirtual(plantas, especies, leituras, relogio),
    obterPlanta: new ObterPlantaDoJardim(plantas, especies, leituras, relogio),
    obterLeituraAtual: new ObterLeituraAtual(leituras),
    conexaoDoSensor: new AcompanharConexaoDoSensor(leituras),
    pesquisarEspecies: new PesquisarEspecies(especies),
    cadastrarPlanta: new CadastrarPlanta(plantas, especies, gerador, relogio),
    editarPlanta: new EditarPlanta(plantas),
    excluirPlanta: new ExcluirPlanta(plantas, regas),
    registrarRega: new RegistrarRega(regas, gerador, relogio),
    obterHistorico: new ObterHistoricoDaPlanta(regas, relogio),
    listarRegas: new ListarRegasDaPlanta(regas, relogio),
    controleDoSensorDeDesenvolvimento: opcoes.controleDoSensorDeDesenvolvimento ?? null,
    pareamentoDoSensor: opcoes.pareamentoDoSensor ?? null,
    avaliarLeitura: new AvaliarLeitura(plantas, leituras, notificador, avisos, relogio),
  };
  return { container, plantas, regas, notificador, avisos };
}

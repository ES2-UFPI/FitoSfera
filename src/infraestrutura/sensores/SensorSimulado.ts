import {
  ConfiguracaoDoSensorDeDesenvolvimento,
  ControleDoSensorDeDesenvolvimento,
} from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { ConexaoDoSensor, EstadoDaConexao } from '@/dominio/modelos/EstadoDaConexao';
import { Leitura } from '@/dominio/modelos/Leitura';
import { CancelarObservacao, SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { Relogio } from '@/dominio/portas/Relogio';
import { MarcaDoContadorDeLuz } from '@/dominio/regras/LuzRecebida';
import { ehNoite, NASCER_DO_SOL, POR_DO_SOL } from '@/dominio/regras/PeriodoDoDia';

/** A hora mais quente de um dia comum, no começo da tarde; a mais fria fica 12 horas depois, de madrugada. */
const HORA_MAIS_QUENTE = 14;
/** A luz perto de uma janela ao meio-dia: o máximo que o modo automático alcança. */
const LUZ_DO_MEIO_DIA = 23000;
/**
 * Um nível forçado só entra no contador entre medições próximas: num trecho mais longo sem medição, ou num salto do
 * relógio da simulação, vale a curva automática.
 */
const INTERVALO_MAXIMO_PARA_SOMAR_MS = 15 * 60_000;
/** O simulador é um aparelho sempre ligado: o mesmo id de reinício, sempre. */
const ID_DE_REINICIO_DO_SIMULADOR = 1;
/** Desde quando o aparelho simulado está ligado: o contador soma a curva automática desde esta data. */
const LIGADO_DESDE = { ano: 2026, mes: 0, dia: 1 };
/** O contador do firmware é um uint32. */
const VOLTA_DO_CONTADOR = 2 ** 32;
const HORAS_DE_SOL = POR_DO_SOL - NASCER_DO_SOL;
/** A luz de um dia inteiro da curva automática, em lux × minutos: a integral do seno das 6h às 18h. */
const LUZ_DE_UM_DIA_AUTOMATICO = LUZ_DO_MEIO_DIA * ((2 * HORAS_DE_SOL) / Math.PI) * 60;

/**
 * A luz da curva automática somada desde `LIGADO_DESDE` até o instante, em lux × minutos. Por ser uma conta só da
 * hora, reabrir o app dá o mesmo contador, como um sensor físico que não desliga quando o celular fecha o app.
 */
function luzAutomaticaAte(instante: Date): number {
  const diasCompletos = Math.round(
    (Date.UTC(instante.getFullYear(), instante.getMonth(), instante.getDate()) -
      Date.UTC(LIGADO_DESDE.ano, LIGADO_DESDE.mes, LIGADO_DESDE.dia)) /
      86_400_000,
  );
  const horas = instante.getHours() + instante.getMinutes() / 60 + instante.getSeconds() / 3600;
  const horasDeSolHoje = Math.min(Math.max(horas - NASCER_DO_SOL, 0), HORAS_DE_SOL);
  const hoje = LUZ_DO_MEIO_DIA * (HORAS_DE_SOL / Math.PI) * (1 - Math.cos((Math.PI * horasDeSolHoje) / HORAS_DE_SOL)) * 60;
  return Math.max(diasCompletos, 0) * LUZ_DE_UM_DIA_AUTOMATICO + hoje;
}

/**
 * Sensor de desenvolvimento: gera leituras de um ambiente de casa que variam ao longo do dia, sem hardware.
 * Ligado por `EXPO_PUBLIC_SENSOR=simulado`.
 */
export class SensorSimulado implements SensorDeAmbiente, ControleDoSensorDeDesenvolvimento {
  private configuracao: ConfiguracaoDoSensorDeDesenvolvimento = {
    umidade: 'automatico',
    temperatura: 'automatico',
    luminosidade: 'automatico',
    desconectado: false,
  };
  private readonly observadores = new Set<(leitura: Leitura) => void>();
  private readonly observadoresDaConexao = new Set<(conexao: ConexaoDoSensor) => void>();
  private ultimaComunicacao: Date | null = null;
  private deslocamentoDoRelogioMs = 0;
  /** O quanto os níveis forçados de luz somaram a mais (ou a menos) que a curva automática, nesta sessão do app. */
  private diferencaDosNiveisForcados = 0;
  private ultimaLuz: { readonly lux: number; readonly em: Date } | null = null;

  constructor(
    private readonly relogio: Relogio,
    private readonly intervaloMs = 5000,
    private readonly idReinicio = ID_DE_REINICIO_DO_SIMULADOR,
  ) {}

  /** O contador de luz agora, no formato que o app guarda como marca: é o ponto de partida da luz forjada. */
  marcaDoContador(): MarcaDoContadorDeLuz {
    const agora = this.obterHorarioSimulado();
    this.somarLuz(this.luminosidade(agora), agora);
    return { idReinicio: this.idReinicio, luzAcumuladaLuxMinutos: this.contador(agora), medidaEm: agora };
  }

  async lerLeituraAtual(): Promise<Leitura | null> {
    return this.medir();
  }

  /** O simulado mede na hora: não há o que esperar. */
  async aguardarLeitura(): Promise<Leitura | null> {
    return this.medir();
  }

  async atualizarLeitura(): Promise<Leitura | null> {
    return this.medir();
  }

  observarLeituras(aoReceber: (leitura: Leitura) => void): CancelarObservacao {
    this.observadores.add(aoReceber);
    const temporizador = setInterval(() => {
      const leitura = this.medir();
      if (leitura !== null) aoReceber(leitura);
    }, this.intervaloMs);
    let cancelada = false;
    return () => {
      if (cancelada) return;
      cancelada = true;
      this.observadores.delete(aoReceber);
      clearInterval(temporizador);
    };
  }

  async consultarEstadoDaConexao(): Promise<EstadoDaConexao> {
    return this.configuracao.desconectado ? 'desconectado' : 'conectado';
  }

  observarConexao(aoMudar: (conexao: ConexaoDoSensor) => void): CancelarObservacao {
    this.observadoresDaConexao.add(aoMudar);
    aoMudar(this.conexao());
    return () => this.observadoresDaConexao.delete(aoMudar);
  }

  obterConfiguracao(): ConfiguracaoDoSensorDeDesenvolvimento {
    return { ...this.configuracao };
  }

  definirConfiguracao(configuracao: ConfiguracaoDoSensorDeDesenvolvimento): void {
    const mudouAConexao = this.configuracao.desconectado !== configuracao.desconectado;
    this.configuracao = { ...configuracao };
    const leitura = this.medir();
    if (leitura !== null) this.observadores.forEach((observador) => observador(leitura));
    if (mudouAConexao) this.observadoresDaConexao.forEach((observador) => observador(this.conexao()));
  }

  obterHorarioSimulado(): Date {
    return new Date(this.relogio.agora().getTime() + this.deslocamentoDoRelogioMs);
  }

  ajustarHorarioSimulado(deltaMs: number): Date {
    this.deslocamentoDoRelogioMs += deltaMs;
    const leitura = this.medir();
    if (leitura !== null) this.observadores.forEach((observador) => observador(leitura));
    this.observadoresDaConexao.forEach((observador) => observador(this.conexao()));
    return this.obterHorarioSimulado();
  }

  redefinirHorarioSimulado(): Date {
    this.deslocamentoDoRelogioMs = 0;
    const leitura = this.medir();
    if (leitura !== null) this.observadores.forEach((observador) => observador(leitura));
    this.observadoresDaConexao.forEach((observador) => observador(this.conexao()));
    return this.obterHorarioSimulado();
  }

  private conexao(): ConexaoDoSensor {
    return {
      estado: this.configuracao.desconectado ? 'desconectado' : 'conectado',
      ultimaComunicacao: this.ultimaComunicacao,
    };
  }

  /** A luz do instante: a curva do dia no automático, ou o nível forçado. */
  private luminosidade(agora: Date): number {
    if (this.configuracao.luminosidade === 'baixo') return 500;
    if (this.configuracao.luminosidade === 'alto') return 100000;
    const horas = agora.getHours() + agora.getMinutes() / 60;
    const sol = ehNoite(agora) ? 0 : Math.sin((Math.PI * (horas - NASCER_DO_SOL)) / (POR_DO_SOL - NASCER_DO_SOL));
    return Math.round(LUZ_DO_MEIO_DIA * sol);
  }

  /**
   * Com um nível de luz forçado, guarda quanto ele somou a mais ou a menos que a curva automática desde a medição
   * anterior, pela média das duas pontas. Soma também desconectado: o sensor físico continua contando com o celular
   * longe. Essa diferença vive só nesta sessão: ao reabrir o app, o contador volta para a curva automática.
   */
  private somarLuz(lux: number, agora: Date): void {
    if (this.ultimaLuz !== null && this.configuracao.luminosidade !== 'automatico') {
      const intervaloMs = agora.getTime() - this.ultimaLuz.em.getTime();
      if (intervaloMs > 0 && intervaloMs <= INTERVALO_MAXIMO_PARA_SOMAR_MS) {
        const forcada = ((this.ultimaLuz.lux + lux) / 2) * (intervaloMs / 60_000);
        this.diferencaDosNiveisForcados += forcada - (luzAutomaticaAte(agora) - luzAutomaticaAte(this.ultimaLuz.em));
      }
    }
    this.ultimaLuz = { lux, em: agora };
  }

  /** O valor que o contador mostra, inteiro e dando a volta como o uint32 do firmware. */
  private contador(agora: Date): number {
    const total = Math.max(luzAutomaticaAte(agora) + this.diferencaDosNiveisForcados, 0);
    return Math.floor(total) % VOLTA_DO_CONTADOR;
  }

  /**
   * Um dia de casa, pelo horário local: luz só entre o nascer e o pôr do sol, com o máximo ao meio-dia; calor no
   * começo da tarde e umidade de madrugada, quando faz mais frio. A leitura leva o contador de luz, como a do sensor
   * físico, para o app somar a luz do dia.
   */
  private medir(): Leitura | null {
    const agora = this.obterHorarioSimulado();
    const luminosidadeLux = this.luminosidade(agora);
    this.somarLuz(luminosidadeLux, agora);
    if (this.configuracao.desconectado) return null;
    this.ultimaComunicacao = agora;
    const horas = agora.getHours() + agora.getMinutes() / 60;
    const calor = Math.cos((2 * Math.PI * (horas - HORA_MAIS_QUENTE)) / 24);
    const umidadeAutomatica = Math.round(60 - 10 * calor);
    const temperaturaAutomatica = Math.round((24 + 4 * calor) * 10) / 10;
    return {
      umidadePercentual:
        this.configuracao.umidade === 'baixo'
          ? 10
          : this.configuracao.umidade === 'alto'
            ? 90
            : umidadeAutomatica,
      temperaturaCelsius:
        this.configuracao.temperatura === 'baixo'
          ? 5
          : this.configuracao.temperatura === 'alto'
            ? 40
            : temperaturaAutomatica,
      luminosidadeLux,
      medidaEm: agora,
      contadorDeLuz: {
        idReinicio: this.idReinicio,
        luzAcumuladaLuxMinutos: this.contador(agora),
        segundosSemConfirmacao: 0,
        ultimaComunicacaoEm: agora,
      },
    };
  }
}

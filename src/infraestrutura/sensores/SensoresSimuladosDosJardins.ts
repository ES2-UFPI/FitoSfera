import {
  ConfiguracaoDoSensorDeDesenvolvimento,
  ControleDoSensorDeDesenvolvimento,
  LUX_DO_SOL_FORTE,
} from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { SensorSimulado } from './SensorSimulado';
import { Relogio } from '@/dominio/portas/Relogio';
import { MarcaDoContadorDeLuz, PeriodoDeLuz } from '@/dominio/regras/LuzRecebida';

/** A hora em que o sol forjado começa. */
export const HORA_DO_SOL_SIMULADO = 7;
/** Os períodos forjados têm o tamanho de um ciclo do sensor físico. */
const PASSO_DO_SOL_SIMULADO_MS = 5 * 60_000;

/** Onde a luz forjada é gravada: o registro de luz do app, por um caminho que só o simulador usa. */
export interface GravadorDeLuzSimulada {
  gravarLuzSimulada(idJardim: string, marca: MarcaDoContadorDeLuz, periodos: readonly PeriodoDeLuz[]): Promise<void>;
}

/** Dá a cada jardim seu próprio relógio de cenário, evitando compartilhar valores entre jardins. */
export class SensoresSimuladosDosJardins implements ControleDoSensorDeDesenvolvimento {
  private readonly sensores = new Map<string, SensorSimulado>();

  constructor(
    private readonly relogio: Relogio,
    private readonly luz?: GravadorDeLuzSimulada,
  ) {}

  obterSensor(idJardim: string): SensorSimulado {
    let sensor = this.sensores.get(idJardim);
    if (!sensor) {
      sensor = new SensorSimulado(this.relogio);
      this.sensores.set(idJardim, sensor);
    }
    return sensor;
  }

  obterConfiguracao(idJardim = 'jardim-principal'): ConfiguracaoDoSensorDeDesenvolvimento {
    return this.obterSensor(idJardim).obterConfiguracao();
  }

  definirConfiguracao(configuracao: ConfiguracaoDoSensorDeDesenvolvimento, idJardim = 'jardim-principal'): void {
    this.obterSensor(idJardim).definirConfiguracao(configuracao);
  }

  obterHorarioSimulado(idJardim = 'jardim-principal'): Date {
    return this.obterSensor(idJardim).obterHorarioSimulado();
  }

  ajustarHorarioSimulado(deltaMs: number, idJardim = 'jardim-principal'): Date {
    return this.obterSensor(idJardim).ajustarHorarioSimulado(deltaMs);
  }

  redefinirHorarioSimulado(idJardim = 'jardim-principal'): Date {
    return this.obterSensor(idJardim).redefinirHorarioSimulado();
  }

  /**
   * Grava períodos de 5 minutos com sol forte das 7h até agora, e a marca do contador do simulador neste instante:
   * assim a próxima leitura dele soma a luz a partir daqui, como se o sensor estivesse no sol desde cedo.
   */
  async simularSolDesdeAs7h(idJardim = 'jardim-principal'): Promise<boolean> {
    if (this.luz === undefined) return false;
    const marca = this.obterSensor(idJardim).marcaDoContador();
    const agora = marca.medidaEm.getTime();
    const inicio = new Date(marca.medidaEm.getFullYear(), marca.medidaEm.getMonth(), marca.medidaEm.getDate(),
      HORA_DO_SOL_SIMULADO).getTime();
    if (agora <= inicio) return false;

    const periodos: PeriodoDeLuz[] = [];
    for (let instante = inicio; instante < agora; instante += PASSO_DO_SOL_SIMULADO_MS) {
      const fim = Math.min(instante + PASSO_DO_SOL_SIMULADO_MS, agora);
      periodos.push({
        luxMinutos: (LUX_DO_SOL_FORTE * (fim - instante)) / 60_000,
        inicio: new Date(instante),
        fim: new Date(fim),
        incompleta: false,
      });
    }
    await this.luz.gravarLuzSimulada(idJardim, marca, periodos);
    return true;
  }
}

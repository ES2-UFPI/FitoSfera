import {
  ConfiguracaoDoSensorDeDesenvolvimento,
  ControleDoSensorDeDesenvolvimento,
} from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { SensorSimulado } from './SensorSimulado';
import { Relogio } from '@/dominio/portas/Relogio';

/** Dá a cada jardim seu próprio relógio de cenário, evitando compartilhar valores entre jardins. */
export class SensoresSimuladosDosJardins implements ControleDoSensorDeDesenvolvimento {
  private readonly sensores = new Map<string, SensorSimulado>();

  constructor(private readonly relogio: Relogio) {}

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
}

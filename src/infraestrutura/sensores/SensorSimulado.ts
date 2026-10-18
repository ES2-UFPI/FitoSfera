import { EstadoDaConexao } from '@/dominio/modelos/EstadoDaConexao';
import { Leitura } from '@/dominio/modelos/Leitura';
import { CancelarObservacao, SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { Relogio } from '@/dominio/portas/Relogio';

const UM_DIA_MS = 24 * 3_600_000;

/**
 * Sensor de desenvolvimento: gera leituras de um ambiente de casa que variam ao longo do dia, sem hardware.
 * Ligado por `EXPO_PUBLIC_SENSOR=simulado`.
 */
export class SensorSimulado implements SensorDeAmbiente {
  constructor(
    private readonly relogio: Relogio,
    private readonly intervaloMs = 5000,
  ) {}

  async lerLeituraAtual(): Promise<Leitura | null> {
    return this.medir();
  }

  observarLeituras(aoReceber: (leitura: Leitura) => void): CancelarObservacao {
    const temporizador = setInterval(() => aoReceber(this.medir()), this.intervaloMs);
    return () => clearInterval(temporizador);
  }

  async consultarEstadoDaConexao(): Promise<EstadoDaConexao> {
    return 'conectado';
  }

  /** Uma onda por dia: mais luz e calor perto do meio-dia, mais umidade de madrugada. */
  private medir(): Leitura {
    const agora = this.relogio.agora();
    const onda = Math.sin((2 * Math.PI * (agora.getTime() % UM_DIA_MS)) / UM_DIA_MS);
    return {
      umidadePercentual: Math.round(60 - 10 * onda),
      temperaturaCelsius: Math.round((24 + 4 * onda) * 10) / 10,
      luminosidadeLux: Math.round(Math.max(0, 12000 + 11000 * onda)),
      medidaEm: agora,
    };
  }
}

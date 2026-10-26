import {
  ConfiguracaoDoSensorDeDesenvolvimento,
  ControleDoSensorDeDesenvolvimento,
} from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { ConexaoDoSensor, EstadoDaConexao } from '@/dominio/modelos/EstadoDaConexao';
import { Leitura } from '@/dominio/modelos/Leitura';
import { CancelarObservacao, SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { Relogio } from '@/dominio/portas/Relogio';

const UM_DIA_MS = 24 * 3_600_000;

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

  constructor(
    private readonly relogio: Relogio,
    private readonly intervaloMs = 5000,
  ) {}

  async lerLeituraAtual(): Promise<Leitura | null> {
    return this.medir();
  }

  /** O simulado mede na hora: não há o que esperar. */
  async aguardarLeitura(): Promise<Leitura | null> {
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

  private conexao(): ConexaoDoSensor {
    return {
      estado: this.configuracao.desconectado ? 'desconectado' : 'conectado',
      ultimaComunicacao: this.ultimaComunicacao,
    };
  }

  /** Uma onda por dia: mais luz e calor perto do meio-dia, mais umidade de madrugada. */
  private medir(): Leitura | null {
    const agora = this.relogio.agora();
    if (this.configuracao.desconectado) return null;
    this.ultimaComunicacao = agora;
    const onda = Math.sin((2 * Math.PI * (agora.getTime() % UM_DIA_MS)) / UM_DIA_MS);
    const umidadeAutomatica = Math.round(60 - 10 * onda);
    const temperaturaAutomatica = Math.round((24 + 4 * onda) * 10) / 10;
    const luminosidadeAutomatica = Math.round(Math.max(0, 12000 + 11000 * onda));
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
      luminosidadeLux:
        this.configuracao.luminosidade === 'baixo'
          ? 500
          : this.configuracao.luminosidade === 'alto'
            ? 100000
            : luminosidadeAutomatica,
      medidaEm: agora,
    };
  }
}

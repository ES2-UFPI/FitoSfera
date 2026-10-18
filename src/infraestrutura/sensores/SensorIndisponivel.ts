import { EstadoDaConexao } from '@/dominio/modelos/EstadoDaConexao';
import { Leitura } from '@/dominio/modelos/Leitura';
import { CancelarObservacao, SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';

/**
 * O padrão enquanto não há hardware: nunca existe leitura, e toda planta fica "sem dados".
 * Quando o sensor real chegar, outro adaptador implementa a mesma porta e entra em `escolherSensor.ts`.
 */
export class SensorIndisponivel implements SensorDeAmbiente {
  async lerLeituraAtual(): Promise<Leitura | null> {
    return null;
  }

  /** Sem sensor, nenhuma leitura chega: o aviso nunca é chamado. */
  observarLeituras(_aoReceber: (leitura: Leitura) => void): CancelarObservacao {
    return () => undefined;
  }

  async consultarEstadoDaConexao(): Promise<EstadoDaConexao> {
    return 'indisponivel';
  }
}

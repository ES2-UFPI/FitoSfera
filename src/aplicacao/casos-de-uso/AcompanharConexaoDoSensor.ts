import { ConexaoDoSensor } from '@/dominio/modelos/EstadoDaConexao';
import { CancelarObservacao, SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';

/** Para a interface dizer se o dado vem de um sensor ligado agora ou de uma leitura antiga. */
export class AcompanharConexaoDoSensor {
  constructor(private readonly sensor: SensorDeAmbiente) {}

  observar(aoMudar: (conexao: ConexaoDoSensor) => void): CancelarObservacao {
    return this.sensor.observarConexao(aoMudar);
  }
}

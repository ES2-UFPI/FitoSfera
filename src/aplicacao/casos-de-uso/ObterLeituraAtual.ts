import { Leitura } from '@/dominio/modelos/Leitura';
import { CancelarObservacao, SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';

/** Obtém uma leitura pontual ou observa novas medições sem expor a implementação do sensor à interface. */
export class ObterLeituraAtual {
  constructor(private readonly sensor: SensorDeAmbiente) {}

  executar(): Promise<Leitura | null> {
    return this.sensor.lerLeituraAtual();
  }

  observar(aoReceber: (leitura: Leitura) => void): CancelarObservacao {
    return this.sensor.observarLeituras(aoReceber);
  }
}

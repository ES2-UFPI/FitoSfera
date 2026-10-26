import { Leitura } from '@/dominio/modelos/Leitura';
import { CancelarObservacao, SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { FontesDeJardim } from '@/dominio/portas/FontesDeJardim';

/** Obtém uma leitura pontual ou observa novas medições sem expor a implementação do sensor à interface. */
export class ObterLeituraAtual {
  constructor(private readonly sensor: SensorDeAmbiente, private readonly fontes?: FontesDeJardim) {}

  async executar(idJardim?: string): Promise<Leitura | null> {
    const sensor = idJardim && this.fontes ? await this.fontes.obter(idJardim) : this.sensor;
    return sensor.lerLeituraAtual();
  }

  observar(aoReceber: (leitura: Leitura) => void, idJardim?: string): CancelarObservacao {
    if (!idJardim || !this.fontes) return this.sensor.observarLeituras(aoReceber);
    let ativo = true;
    let cancelar: CancelarObservacao | null = null;
    void this.fontes.obter(idJardim).then((sensor) => {
      if (ativo) cancelar = sensor.observarLeituras(aoReceber);
    }, (falha) => console.warn('Não deu para observar o sensor do jardim.', falha));
    return () => { ativo = false; cancelar?.(); };
  }
}

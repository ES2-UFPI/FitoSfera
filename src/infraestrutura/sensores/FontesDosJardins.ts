import { FontesDeJardim } from '@/dominio/portas/FontesDeJardim';
import { SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { RepositorioDeJardins } from '@/dominio/portas/RepositorioDeJardins';
import { CentralDeSensoresBluetooth } from './CentralDeSensoresBluetooth';
import { SensoresSimuladosDosJardins } from './SensoresSimuladosDosJardins';
import { SensorIndisponivel } from './SensorIndisponivel';

export class FontesDosJardins implements FontesDeJardim {
  private readonly indisponivel = new SensorIndisponivel();
  constructor(private readonly jardins: RepositorioDeJardins, private readonly bluetooth: CentralDeSensoresBluetooth | null,
    private readonly simulados: SensoresSimuladosDosJardins | null = null) {}

  async obter(idJardim: string): Promise<SensorDeAmbiente> {
    const jardim = (await this.jardins.listar()).find((item) => item.id === idJardim);
    const idSensor = jardim?.idSensor;
    if (idSensor === 'simulado' || idSensor === `simulado:${idJardim}`)
      return this.simulados?.obterSensor(idJardim) ?? this.indisponivel;
    if (!idSensor || !this.bluetooth) return this.indisponivel;
    const pareado = (await this.bluetooth.listarPareados()).some((sensor) => sensor.id === idSensor);
    return pareado ? this.bluetooth.obterSensor(idSensor) : this.indisponivel;
  }
}

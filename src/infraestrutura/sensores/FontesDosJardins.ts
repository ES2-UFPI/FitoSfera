import { FontesDeJardim } from '@/dominio/portas/FontesDeJardim';
import { SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { RepositorioDeJardins } from '@/dominio/portas/RepositorioDeJardins';
import { CentralDeSensoresBluetooth } from './CentralDeSensoresBluetooth';
import { SensoresSimuladosDosJardins } from './SensoresSimuladosDosJardins';
import { SensorIndisponivel } from './SensorIndisponivel';
import { CacheDeLeituras } from '@/dominio/portas/CacheDeLeituras';
import { SensorComCache } from './SensorComCache';

export class FontesDosJardins implements FontesDeJardim {
  private readonly indisponivel = new SensorIndisponivel();
  constructor(private readonly jardins: RepositorioDeJardins, private readonly bluetooth: CentralDeSensoresBluetooth | null,
    private readonly simulados: SensoresSimuladosDosJardins | null = null,
    private readonly leituras?: CacheDeLeituras) {}

  async obter(idJardim: string): Promise<SensorDeAmbiente> {
    const jardim = (await this.jardins.listar()).find((item) => item.id === idJardim);
    const idSensor = jardim?.idSensor;
    let sensor: SensorDeAmbiente;
    if (idSensor === 'simulado' || idSensor === `simulado:${idJardim}`)
      sensor = this.simulados?.obterSensor(idJardim) ?? this.indisponivel;
    else if (!idSensor || !this.bluetooth) sensor = this.indisponivel;
    else {
      const pareado = (await this.bluetooth.listarPareados()).some((item) => item.id === idSensor);
      sensor = pareado ? this.bluetooth.obterSensor(idSensor) : this.indisponivel;
    }
    if (this.leituras) {
      return new SensorComCache(sensor, this.leituras, idJardim);
    }
    return sensor;
  }

  async obterHorarioDeReferencia(idJardim: string): Promise<Date | null> {
    const jardim = (await this.jardins.listar()).find((item) => item.id === idJardim);
    const simulado = jardim?.idSensor === 'simulado' || jardim?.idSensor === `simulado:${idJardim}`;
    return simulado ? this.simulados?.obterHorarioSimulado(idJardim) ?? null : null;
  }
}

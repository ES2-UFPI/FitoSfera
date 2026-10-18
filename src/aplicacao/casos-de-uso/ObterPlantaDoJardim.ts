import { SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';
import { AvaliadorDoJardim } from './AvaliadorDoJardim';
import { PlantaNoJardim } from './PlantaNoJardim';

export class ObterPlantaDoJardim {
  private readonly avaliador: AvaliadorDoJardim;

  constructor(
    private readonly plantas: RepositorioDePlantas,
    especies: RepositorioDeEspecies,
    sensor: SensorDeAmbiente,
    relogio: Relogio,
  ) {
    this.avaliador = new AvaliadorDoJardim(especies, sensor, relogio);
  }

  async executar(id: string): Promise<PlantaNoJardim | null> {
    const planta = await this.plantas.obterPorId(id);
    if (planta === null) return null;
    return this.avaliador.avaliar(planta, await this.avaliador.lerSensor());
  }
}

import { FonteDeLeituras } from '@/dominio/portas/FonteDeLeituras';
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
    leituras: FonteDeLeituras,
    relogio: Relogio,
  ) {
    this.avaliador = new AvaliadorDoJardim(especies, leituras, relogio);
  }

  async executar(id: string): Promise<PlantaNoJardim | null> {
    const planta = await this.plantas.obterPorId(id);
    if (planta === null) return null;
    return this.avaliador.avaliar(planta, await this.avaliador.lerSensor());
  }
}

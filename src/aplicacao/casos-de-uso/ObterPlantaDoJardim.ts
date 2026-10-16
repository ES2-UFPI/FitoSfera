import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';
import { PlantaNoJardim } from './PlantaNoJardim';

export class ObterPlantaDoJardim {
  constructor(
    private readonly plantas: RepositorioDePlantas,
    private readonly especies: RepositorioDeEspecies,
  ) {}

  async executar(id: string): Promise<PlantaNoJardim | null> {
    const planta = await this.plantas.obterPorId(id);
    if (planta === null) return null;
    return { planta, especie: await this.especies.obterPorId(planta.idEspecie) };
  }
}

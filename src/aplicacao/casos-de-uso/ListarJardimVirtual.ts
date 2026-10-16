import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';
import { PlantaNoJardim } from './PlantaNoJardim';

/** Alimenta a estante: todas as plantas, na ordem de cadastro. */
export class ListarJardimVirtual {
  constructor(
    private readonly plantas: RepositorioDePlantas,
    private readonly especies: RepositorioDeEspecies,
  ) {}

  async executar(): Promise<readonly PlantaNoJardim[]> {
    const plantas = await this.plantas.listar();
    return Promise.all(
      plantas.map(async (planta) => ({ planta, especie: await this.especies.obterPorId(planta.idEspecie) })),
    );
  }
}

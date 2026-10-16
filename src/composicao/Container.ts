import { AdicionarPlantaAoJardim } from '@/aplicacao/casos-de-uso/AdicionarPlantaAoJardim';
import { ListarJardimVirtual } from '@/aplicacao/casos-de-uso/ListarJardimVirtual';
import { ObterPlantaDoJardim } from '@/aplicacao/casos-de-uso/ObterPlantaDoJardim';
import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';

/** Os casos de uso que a interface pode chamar. */
export interface Container {
  readonly listarJardim: ListarJardimVirtual;
  readonly obterPlanta: ObterPlantaDoJardim;
  readonly pesquisarEspecies: PesquisarEspecies;
  readonly adicionarPlanta: AdicionarPlantaAoJardim;
}

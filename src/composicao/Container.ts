import { CadastrarPlanta } from '@/aplicacao/casos-de-uso/CadastrarPlanta';
import { ExcluirPlanta } from '@/aplicacao/casos-de-uso/ExcluirPlanta';
import { ListarJardimVirtual } from '@/aplicacao/casos-de-uso/ListarJardimVirtual';
import { ObterPlantaDoJardim } from '@/aplicacao/casos-de-uso/ObterPlantaDoJardim';
import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';

/** Os casos de uso que a interface pode chamar. */
export interface Container {
  readonly listarJardim: ListarJardimVirtual;
  readonly obterPlanta: ObterPlantaDoJardim;
  readonly pesquisarEspecies: PesquisarEspecies;
  readonly cadastrarPlanta: CadastrarPlanta;
  readonly excluirPlanta: ExcluirPlanta;
}

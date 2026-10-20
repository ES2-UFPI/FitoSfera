import { AvaliarLeitura } from '@/aplicacao/casos-de-uso/AvaliarLeitura';
import { CadastrarPlanta } from '@/aplicacao/casos-de-uso/CadastrarPlanta';
import { ExcluirPlanta } from '@/aplicacao/casos-de-uso/ExcluirPlanta';
import { ListarJardimVirtual } from '@/aplicacao/casos-de-uso/ListarJardimVirtual';
import { ObterPlantaDoJardim } from '@/aplicacao/casos-de-uso/ObterPlantaDoJardim';
import { ObterLeituraAtual } from '@/aplicacao/casos-de-uso/ObterLeituraAtual';
import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';
import { RegistrarRega } from '@/aplicacao/casos-de-uso/RegistrarRega';
import { ControleDoSensorDeDesenvolvimento } from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';

/** Os casos de uso que a interface pode chamar. */
export interface Container {
  readonly listarJardim: ListarJardimVirtual;
  readonly obterPlanta: ObterPlantaDoJardim;
  readonly obterLeituraAtual: ObterLeituraAtual;
  readonly pesquisarEspecies: PesquisarEspecies;
  readonly cadastrarPlanta: CadastrarPlanta;
  readonly excluirPlanta: ExcluirPlanta;
  readonly registrarRega: RegistrarRega;
  readonly controleDoSensorDeDesenvolvimento: ControleDoSensorDeDesenvolvimento | null;
  readonly avaliarLeitura: AvaliarLeitura;
}

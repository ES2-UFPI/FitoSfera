import { AcompanharConexaoDoSensor } from '@/aplicacao/casos-de-uso/AcompanharConexaoDoSensor';
import { AvaliarLeitura } from '@/aplicacao/casos-de-uso/AvaliarLeitura';
import { CadastrarPlanta } from '@/aplicacao/casos-de-uso/CadastrarPlanta';
import { EditarPlanta } from '@/aplicacao/casos-de-uso/EditarPlanta';
import { ExcluirPlanta } from '@/aplicacao/casos-de-uso/ExcluirPlanta';
import { ListarJardimVirtual } from '@/aplicacao/casos-de-uso/ListarJardimVirtual';
import { ObterPlantaDoJardim } from '@/aplicacao/casos-de-uso/ObterPlantaDoJardim';
import { ObterHistoricoDaPlanta } from '@/aplicacao/casos-de-uso/ObterHistoricoDaPlanta';
import { ObterLeituraAtual } from '@/aplicacao/casos-de-uso/ObterLeituraAtual';
import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';
import { RegistrarRega } from '@/aplicacao/casos-de-uso/RegistrarRega';
import { GerenciarJardins } from '@/aplicacao/casos-de-uso/GerenciarJardins';
import { ControleDoSensorDeDesenvolvimento } from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { PareamentoDoSensor } from '@/aplicacao/portas/PareamentoDoSensor';

/** Os casos de uso que a interface pode chamar. */
export interface Container {
  readonly gerenciarJardins: GerenciarJardins;
  readonly listarJardim: ListarJardimVirtual;
  readonly obterPlanta: ObterPlantaDoJardim;
  readonly obterLeituraAtual: ObterLeituraAtual;
  readonly conexaoDoSensor: AcompanharConexaoDoSensor;
  readonly pesquisarEspecies: PesquisarEspecies;
  readonly cadastrarPlanta: CadastrarPlanta;
  readonly editarPlanta: EditarPlanta;
  readonly excluirPlanta: ExcluirPlanta;
  readonly registrarRega: RegistrarRega;
  readonly obterHistorico: ObterHistoricoDaPlanta;
  readonly controleDoSensorDeDesenvolvimento: ControleDoSensorDeDesenvolvimento | null;
  readonly pareamentoDoSensor: PareamentoDoSensor | null;
  readonly avaliarLeitura: AvaliarLeitura;
}

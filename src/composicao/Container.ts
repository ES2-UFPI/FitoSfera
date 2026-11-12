import { AcompanharConexaoDoSensor } from '@/aplicacao/casos-de-uso/AcompanharConexaoDoSensor';
import { AjustarPreferencias } from '@/aplicacao/casos-de-uso/AjustarPreferencias';
import { AtualizarLeituras } from '@/aplicacao/casos-de-uso/AtualizarLeituras';
import { AvaliarLeitura } from '@/aplicacao/casos-de-uso/AvaliarLeitura';
import { CadastrarPlanta } from '@/aplicacao/casos-de-uso/CadastrarPlanta';
import { CompararRendimento } from '@/aplicacao/casos-de-uso/CompararRendimento';
import { EditarPlanta } from '@/aplicacao/casos-de-uso/EditarPlanta';
import { ExcluirPlanta } from '@/aplicacao/casos-de-uso/ExcluirPlanta';
import { ListarJardimVirtual } from '@/aplicacao/casos-de-uso/ListarJardimVirtual';
import { ListarRegasDaPlanta } from '@/aplicacao/casos-de-uso/ListarRegasDaPlanta';
import { ObterPlantaDoJardim } from '@/aplicacao/casos-de-uso/ObterPlantaDoJardim';
import { ObterHistoricoDaPlanta } from '@/aplicacao/casos-de-uso/ObterHistoricoDaPlanta';
import { ObterLeituraAtual } from '@/aplicacao/casos-de-uso/ObterLeituraAtual';
import { ObterLuzDoDia } from '@/aplicacao/casos-de-uso/ObterLuzDoDia';
import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';
import { RegistrarColheita } from '@/aplicacao/casos-de-uso/RegistrarColheita';
import { RegistrarRega } from '@/aplicacao/casos-de-uso/RegistrarRega';
import { GerenciarJardins } from '@/aplicacao/casos-de-uso/GerenciarJardins';
import { ControleDoSensorDeDesenvolvimento } from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { ToquesNaNotificacao } from '@/aplicacao/portas/ToquesNaNotificacao';
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
  readonly registrarColheita: RegistrarColheita;
  readonly compararRendimento: CompararRendimento;
  readonly obterHistorico: ObterHistoricoDaPlanta;
  readonly listarRegas: ListarRegasDaPlanta;
  readonly obterLuzDoDia: ObterLuzDoDia;
  readonly controleDoSensorDeDesenvolvimento: ControleDoSensorDeDesenvolvimento | null;
  readonly toquesNaNotificacao: ToquesNaNotificacao;
  readonly pareamentoDoSensor: PareamentoDoSensor | null;
  readonly avaliarLeitura: AvaliarLeitura;
  readonly ajustarPreferencias: AjustarPreferencias;
  readonly atualizarLeituras: AtualizarLeituras;
}

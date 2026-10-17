import AsyncStorage from '@react-native-async-storage/async-storage';
import { CadastrarPlanta } from '@/aplicacao/casos-de-uso/CadastrarPlanta';
import { ListarJardimVirtual } from '@/aplicacao/casos-de-uso/ListarJardimVirtual';
import { ObterPlantaDoJardim } from '@/aplicacao/casos-de-uso/ObterPlantaDoJardim';
import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';
import { RepositorioDeEspeciesLocal } from '@/infraestrutura/catalogo/RepositorioDeEspeciesLocal';
import { GeradorDeIdentificadorAleatorio } from '@/infraestrutura/identificador/GeradorDeIdentificadorAleatorio';
import { ArmazenamentoComMigracao } from '@/infraestrutura/persistencia/ArmazenamentoComMigracao';
import { MigradorDoArmazenamento } from '@/infraestrutura/persistencia/MigradorDoArmazenamento';
import { RepositorioDePlantasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDePlantasAsyncStorage';
import { FonteDeLeiturasIndisponivel } from '@/infraestrutura/sensores/FonteDeLeiturasIndisponivel';
import { RelogioDoSistema } from '@/infraestrutura/tempo/RelogioDoSistema';
import { Container } from './Container';

/** Raiz de composição: o único lugar do app que escolhe as implementações concretas. */
export function criarContainer(): Container {
  const armazenamento = new ArmazenamentoComMigracao(AsyncStorage, new MigradorDoArmazenamento(AsyncStorage));
  const plantas = new RepositorioDePlantasAsyncStorage(armazenamento);
  const especies = new RepositorioDeEspeciesLocal();
  const leituras = new FonteDeLeiturasIndisponivel();
  const relogio = new RelogioDoSistema();

  return {
    listarJardim: new ListarJardimVirtual(plantas, especies, leituras, relogio),
    obterPlanta: new ObterPlantaDoJardim(plantas, especies, leituras, relogio),
    pesquisarEspecies: new PesquisarEspecies(especies),
    cadastrarPlanta: new CadastrarPlanta(plantas, especies, new GeradorDeIdentificadorAleatorio(), relogio),
  };
}

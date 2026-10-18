import AsyncStorage from '@react-native-async-storage/async-storage';
import { CadastrarPlanta } from '@/aplicacao/casos-de-uso/CadastrarPlanta';
import { ExcluirPlanta } from '@/aplicacao/casos-de-uso/ExcluirPlanta';
import { ListarJardimVirtual } from '@/aplicacao/casos-de-uso/ListarJardimVirtual';
import { ObterPlantaDoJardim } from '@/aplicacao/casos-de-uso/ObterPlantaDoJardim';
import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';
import { RepositorioDeEspeciesLocal } from '@/infraestrutura/catalogo/RepositorioDeEspeciesLocal';
import { GeradorDeIdentificadorAleatorio } from '@/infraestrutura/identificador/GeradorDeIdentificadorAleatorio';
import { ArmazenamentoComMigracao } from '@/infraestrutura/persistencia/ArmazenamentoComMigracao';
import { MigradorDoArmazenamento } from '@/infraestrutura/persistencia/MigradorDoArmazenamento';
import { RepositorioDePlantasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDePlantasAsyncStorage';
import { RepositorioDeRegasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeRegasAsyncStorage';
import { RelogioDoSistema } from '@/infraestrutura/tempo/RelogioDoSistema';
import { Container } from './Container';
import { escolherSensor } from './escolherSensor';

/** Raiz de composição: o único lugar do app que escolhe as implementações concretas. */
export function criarContainer(): Container {
  const armazenamento = new ArmazenamentoComMigracao(AsyncStorage, new MigradorDoArmazenamento(AsyncStorage));
  const plantas = new RepositorioDePlantasAsyncStorage(armazenamento);
  const regas = new RepositorioDeRegasAsyncStorage(armazenamento);
  const especies = new RepositorioDeEspeciesLocal();
  const relogio = new RelogioDoSistema();
  // O Expo só embute a variável no app quando ela é lida assim, por extenso.
  const sensor = escolherSensor(process.env.EXPO_PUBLIC_SENSOR, relogio);

  return {
    listarJardim: new ListarJardimVirtual(plantas, especies, sensor, relogio),
    obterPlanta: new ObterPlantaDoJardim(plantas, especies, sensor, relogio),
    pesquisarEspecies: new PesquisarEspecies(especies),
    cadastrarPlanta: new CadastrarPlanta(plantas, especies, new GeradorDeIdentificadorAleatorio(), relogio),
    excluirPlanta: new ExcluirPlanta(plantas, regas),
  };
}

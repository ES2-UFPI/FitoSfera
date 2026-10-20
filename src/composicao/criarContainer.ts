import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AvaliarLeitura } from '@/aplicacao/casos-de-uso/AvaliarLeitura';
import { CadastrarPlanta } from '@/aplicacao/casos-de-uso/CadastrarPlanta';
import { ExcluirPlanta } from '@/aplicacao/casos-de-uso/ExcluirPlanta';
import { ListarJardimVirtual } from '@/aplicacao/casos-de-uso/ListarJardimVirtual';
import { ObterPlantaDoJardim } from '@/aplicacao/casos-de-uso/ObterPlantaDoJardim';
import { ObterHistoricoDaPlanta } from '@/aplicacao/casos-de-uso/ObterHistoricoDaPlanta';
import { ObterLeituraAtual } from '@/aplicacao/casos-de-uso/ObterLeituraAtual';
import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';
import { RegistrarRega } from '@/aplicacao/casos-de-uso/RegistrarRega';
import { RepositorioDeEspeciesLocal } from '@/infraestrutura/catalogo/RepositorioDeEspeciesLocal';
import { GeradorDeIdentificadorAleatorio } from '@/infraestrutura/identificador/GeradorDeIdentificadorAleatorio';
import { ArmazenamentoComMigracao } from '@/infraestrutura/persistencia/ArmazenamentoComMigracao';
import { MigradorDoArmazenamento } from '@/infraestrutura/persistencia/MigradorDoArmazenamento';
import { RepositorioDeAvisosAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeAvisosAsyncStorage';
import { RepositorioDePlantasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDePlantasAsyncStorage';
import { RepositorioDeRegasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeRegasAsyncStorage';
import { SensorSimulado } from '@/infraestrutura/sensores/SensorSimulado';
import { RelogioDoSistema } from '@/infraestrutura/tempo/RelogioDoSistema';
import { Container } from './Container';
import { escolherNotificador } from './escolherNotificador';
import { escolherSensor } from './escolherSensor';

/** Raiz de composição: o único lugar do app que escolhe as implementações concretas. */
export function criarContainer(): Container {
  const armazenamento = new ArmazenamentoComMigracao(AsyncStorage, new MigradorDoArmazenamento(AsyncStorage));
  const plantas = new RepositorioDePlantasAsyncStorage(armazenamento);
  const regas = new RepositorioDeRegasAsyncStorage(armazenamento);
  const avisos = new RepositorioDeAvisosAsyncStorage(armazenamento);
  const especies = new RepositorioDeEspeciesLocal();
  const relogio = new RelogioDoSistema();
  const gerador = new GeradorDeIdentificadorAleatorio();
  // O Expo só embute a variável no app quando ela é lida assim, por extenso.
  const sensor = escolherSensor(process.env.EXPO_PUBLIC_SENSOR, relogio, __DEV__);
  const notificador = escolherNotificador(Platform.OS);

  return {
    listarJardim: new ListarJardimVirtual(plantas, especies, sensor, relogio),
    obterPlanta: new ObterPlantaDoJardim(plantas, especies, sensor, relogio),
    obterLeituraAtual: new ObterLeituraAtual(sensor),
    pesquisarEspecies: new PesquisarEspecies(especies),
    cadastrarPlanta: new CadastrarPlanta(plantas, especies, gerador, relogio),
    excluirPlanta: new ExcluirPlanta(plantas, regas),
    registrarRega: new RegistrarRega(regas, gerador, relogio),
    obterHistorico: new ObterHistoricoDaPlanta(regas, relogio),
    controleDoSensorDeDesenvolvimento: sensor instanceof SensorSimulado ? sensor : null,
    avaliarLeitura: new AvaliarLeitura(plantas, sensor, notificador, avisos, relogio),
  };
}

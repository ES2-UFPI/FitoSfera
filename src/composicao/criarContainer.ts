import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AcompanharConexaoDoSensor } from '@/aplicacao/casos-de-uso/AcompanharConexaoDoSensor';
import { AvaliarLeitura } from '@/aplicacao/casos-de-uso/AvaliarLeitura';
import { CadastrarPlanta } from '@/aplicacao/casos-de-uso/CadastrarPlanta';
import { EditarPlanta } from '@/aplicacao/casos-de-uso/EditarPlanta';
import { ExcluirPlanta } from '@/aplicacao/casos-de-uso/ExcluirPlanta';
import { ListarJardimVirtual } from '@/aplicacao/casos-de-uso/ListarJardimVirtual';
import { ListarRegasDaPlanta } from '@/aplicacao/casos-de-uso/ListarRegasDaPlanta';
import { ObterPlantaDoJardim } from '@/aplicacao/casos-de-uso/ObterPlantaDoJardim';
import { ObterHistoricoDaPlanta } from '@/aplicacao/casos-de-uso/ObterHistoricoDaPlanta';
import { ObterLeituraAtual } from '@/aplicacao/casos-de-uso/ObterLeituraAtual';
import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';
import { RegistrarRega } from '@/aplicacao/casos-de-uso/RegistrarRega';
import { GerenciarJardins } from '@/aplicacao/casos-de-uso/GerenciarJardins';
import { RepositorioDeEspeciesLocal } from '@/infraestrutura/catalogo/RepositorioDeEspeciesLocal';
import { GeradorDeIdentificadorAleatorio } from '@/infraestrutura/identificador/GeradorDeIdentificadorAleatorio';
import { ArmazenamentoComMigracao } from '@/infraestrutura/persistencia/ArmazenamentoComMigracao';
import { MigradorDoArmazenamento } from '@/infraestrutura/persistencia/MigradorDoArmazenamento';
import { RepositorioDeAvisosAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeAvisosAsyncStorage';
import { RepositorioDePlantasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDePlantasAsyncStorage';
import { RepositorioDeRegasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeRegasAsyncStorage';
import { RepositorioDeJardinsAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeJardinsAsyncStorage';
import { CentralDeSensoresBluetooth } from '@/infraestrutura/sensores/CentralDeSensoresBluetooth';
import { FontesDosJardins } from '@/infraestrutura/sensores/FontesDosJardins';
import { SensorSimulado } from '@/infraestrutura/sensores/SensorSimulado';
import { SensoresSimuladosDosJardins } from '@/infraestrutura/sensores/SensoresSimuladosDosJardins';
import { RelogioDoSistema } from '@/infraestrutura/tempo/RelogioDoSistema';
import { Container } from './Container';
import { escolherNotificador } from './escolherNotificador';
import { criarSensorBluetooth } from './criarSensorBluetooth';
import { escolherSensor } from './escolherSensor';
import { escolherToquesNaNotificacao } from './escolherToquesNaNotificacao';

/** Raiz de composição: o único lugar do app que escolhe as implementações concretas. */
export function criarContainer(): Container {
  const armazenamento = new ArmazenamentoComMigracao(AsyncStorage, new MigradorDoArmazenamento(AsyncStorage));
  const plantas = new RepositorioDePlantasAsyncStorage(armazenamento);
  const jardins = new RepositorioDeJardinsAsyncStorage(armazenamento);
  const regas = new RepositorioDeRegasAsyncStorage(armazenamento);
  const avisos = new RepositorioDeAvisosAsyncStorage(armazenamento);
  const especies = new RepositorioDeEspeciesLocal();
  const relogio = new RelogioDoSistema();
  const gerador = new GeradorDeIdentificadorAleatorio();
  // O Expo só embute a variável no app quando ela é lida assim, por extenso.
  const sensor = escolherSensor(process.env.EXPO_PUBLIC_SENSOR, relogio, __DEV__, () =>
    criarSensorBluetooth(armazenamento, relogio),
  );
  const simulados = sensor instanceof SensorSimulado ? new SensoresSimuladosDosJardins(relogio) : null;
  const fontes = new FontesDosJardins(jardins, sensor instanceof CentralDeSensoresBluetooth ? sensor : null, simulados);
  const notificador = escolherNotificador(Platform.OS);
  const toquesNaNotificacao = escolherToquesNaNotificacao(Platform.OS);

  return {
    gerenciarJardins: new GerenciarJardins(jardins, gerador,
      sensor instanceof CentralDeSensoresBluetooth ? sensor : undefined),
    listarJardim: new ListarJardimVirtual(plantas, especies, sensor, relogio, fontes),
    obterPlanta: new ObterPlantaDoJardim(plantas, especies, sensor, relogio, fontes),
    obterLeituraAtual: new ObterLeituraAtual(sensor, fontes),
    conexaoDoSensor: new AcompanharConexaoDoSensor(sensor, fontes),
    pesquisarEspecies: new PesquisarEspecies(especies),
    cadastrarPlanta: new CadastrarPlanta(plantas, especies, gerador, relogio),
    editarPlanta: new EditarPlanta(plantas),
    excluirPlanta: new ExcluirPlanta(plantas, regas),
    registrarRega: new RegistrarRega(regas, gerador, relogio),
    obterHistorico: new ObterHistoricoDaPlanta(regas, relogio),
    listarRegas: new ListarRegasDaPlanta(regas, relogio),
    controleDoSensorDeDesenvolvimento: simulados,
    pareamentoDoSensor: sensor instanceof CentralDeSensoresBluetooth ? sensor : null,
    avaliarLeitura: new AvaliarLeitura(plantas, sensor, notificador, avisos, relogio, fontes),
  };
}

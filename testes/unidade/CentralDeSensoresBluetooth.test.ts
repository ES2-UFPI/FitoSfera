import { ClienteBle, ConexaoBle } from '@/infraestrutura/sensores/ClienteBle';
import { CentralDeSensoresBluetooth } from '@/infraestrutura/sensores/CentralDeSensoresBluetooth';
import { RepositorioDeSensoresPareadosAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeSensoresPareadosAsyncStorage';
import { CHAVES } from '@/infraestrutura/persistencia/chaves';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';
import { RelogioParado } from '../apoio/fakes';

const pacote = '0gmoFugDAAA=';

class ClienteFalso implements ClienteBle {
  async temPermissoes() { return true; }
  async pedirPermissoes() { return true; }
  async consultarEstado() { return 'ligado' as const; }
  observarEstado() { return () => undefined; }
  procurar() { return () => undefined; }
  async conectar(): Promise<ConexaoBle> {
    return {
      monitorar: () => () => undefined,
      ler: async () => pacote,
      pedirLeitura: async () => undefined,
      aoCair: () => () => undefined,
      desconectar: async () => undefined,
    };
  }
}

test('mantém dois sensores independentes e lê a lista após reabrir', async () => {
  const armazenamento = new ArmazenamentoEmMemoria();
  const guarda = new RepositorioDeSensoresPareadosAsyncStorage(armazenamento);
  const central = new CentralDeSensoresBluetooth(new ClienteFalso(), guarda, new RelogioParado());
  await central.parear({ id: 'ble-1', nome: 'Varanda' });
  await central.parear({ id: 'ble-2', nome: 'Sala' });
  expect((await guarda.listar()).map((sensor) => sensor.id)).toEqual(['ble-1', 'ble-2']);
  expect(await central.obterSensor('ble-1').lerLeituraAtual()).toMatchObject({ temperaturaCelsius: 25.14 });
  await central.esquecer('ble-1');
  expect((await new RepositorioDeSensoresPareadosAsyncStorage(armazenamento).listar()).map((sensor) => sensor.id))
    .toEqual(['ble-2']);
});

test('registro único da versão anterior é mantido ao incluir outro sensor', async () => {
  const armazenamento = new ArmazenamentoEmMemoria({
    [CHAVES.sensorPareado]: JSON.stringify({ id: 'ble-antigo', nome: 'Antigo' }),
  });
  const guarda = new RepositorioDeSensoresPareadosAsyncStorage(armazenamento);
  expect(await guarda.listar()).toEqual([{ id: 'ble-antigo', nome: 'Antigo' }]);
  await guarda.salvar({ id: 'ble-novo', nome: 'Novo' });
  expect((await guarda.listar()).map((sensor) => sensor.id)).toEqual(['ble-antigo', 'ble-novo']);
});

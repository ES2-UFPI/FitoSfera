import { GerenciarJardins, SensorJaEmUso } from '@/aplicacao/casos-de-uso/GerenciarJardins';
import { JARDIM_PRINCIPAL } from '@/dominio/modelos/Jardim';
import { RepositorioDeJardinsAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeJardinsAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';
import { GeradorSequencial, RepositorioDeRegasEmMemoria } from '../apoio/fakes';
import { CHAVES } from '@/infraestrutura/persistencia/chaves';

test('jardins e seleção sobrevivem à recriação do repositório', async () => {
  const armazenamento = new ArmazenamentoEmMemoria();
  const jardins = new RepositorioDeJardinsAsyncStorage(armazenamento);
  const uso = new GerenciarJardins(jardins, new GeradorSequencial());
  const varanda = await uso.criar(' Varanda ');
  await uso.selecionar(varanda.id);
  await uso.associar(varanda.id, 'ble-1');

  const reaberto = new RepositorioDeJardinsAsyncStorage(armazenamento);
  expect(await reaberto.obterSelecionado()).toBe(varanda.id);
  expect(await reaberto.listar()).toContainEqual({ ...varanda, nome: 'Varanda', idSensor: 'ble-1' });
});

test('sensor já associado não pode pertencer a outro jardim; desassociar mantém os demais dados', async () => {
  const jardins = new RepositorioDeJardinsAsyncStorage(new ArmazenamentoEmMemoria());
  const uso = new GerenciarJardins(jardins, new GeradorSequencial());
  const sala = await uso.criar('Sala');
  await uso.associar(JARDIM_PRINCIPAL.id, 'ble-1');
  await expect(uso.associar(sala.id, 'ble-1')).rejects.toThrow(SensorJaEmUso);
  expect((await jardins.listar()).find((jardim) => jardim.id === sala.id)?.idSensor).toBeNull();
  await uso.desassociar(JARDIM_PRINCIPAL.id);
  expect((await jardins.listar()).find((jardim) => jardim.id === JARDIM_PRINCIPAL.id)?.idSensor).toBeNull();
  await uso.associar(sala.id, 'ble-1');
  expect((await jardins.listar()).find((jardim) => jardim.id === sala.id)?.idSensor).toBe('ble-1');
});

test('planta e pareamento antigos continuam no jardim principal', async () => {
  const armazenamento = new ArmazenamentoEmMemoria({
    [CHAVES.sensorPareado]: JSON.stringify({ id: 'ble-antigo', nome: 'FitoSfera' }),
  });
  const jardins = new RepositorioDeJardinsAsyncStorage(armazenamento);
  expect(await jardins.listar()).toEqual([{ ...JARDIM_PRINCIPAL, idSensor: 'ble-antigo' }]);
  await jardins.salvar({ ...JARDIM_PRINCIPAL, idSensor: null });
  expect(await jardins.listar()).toEqual([JARDIM_PRINCIPAL]);
});

test('desassociar o sensor não remove o histórico de regas das plantas', async () => {
  const jardins = new RepositorioDeJardinsAsyncStorage(new ArmazenamentoEmMemoria());
  const uso = new GerenciarJardins(jardins, new GeradorSequencial());
  const regas = new RepositorioDeRegasEmMemoria(false, [
    { id: 'r1', idPlanta: 'p1', regadaEm: new Date(2026, 9, 22) },
  ]);
  await uso.associar(JARDIM_PRINCIPAL.id, 'ble-1');
  await uso.desassociar(JARDIM_PRINCIPAL.id);
  expect(await regas.listarPorPlanta('p1')).toHaveLength(1);
});

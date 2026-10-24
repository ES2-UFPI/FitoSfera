import { RepositorioDoSensorPareadoAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDoSensorPareadoAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';

const CHAVE = 'fitosfera:v2:sensor-pareado';

test('começa sem sensor, guarda, lê de volta e esquece', async () => {
  const armazenamento = new ArmazenamentoEmMemoria();
  const repo = new RepositorioDoSensorPareadoAsyncStorage(armazenamento);
  expect(await repo.obter()).toBeNull();

  await repo.salvar({ id: 'AA:BB', nome: 'FitoSfera' });
  expect(JSON.parse(armazenamento.valores.get(CHAVE) ?? 'null')).toEqual({ id: 'AA:BB', nome: 'FitoSfera' });
  expect(await repo.obter()).toEqual({ id: 'AA:BB', nome: 'FitoSfera' });

  await repo.esquecer();
  expect(await repo.obter()).toBeNull();
});

test.each(['{quebrado', 'null', '{"id":42}'])('conteúdo ilegível %p conta como nenhum sensor', async (bruto) => {
  const armazenamento = new ArmazenamentoEmMemoria();
  await armazenamento.setItem(CHAVE, bruto);
  expect(await new RepositorioDoSensorPareadoAsyncStorage(armazenamento).obter()).toBeNull();
});

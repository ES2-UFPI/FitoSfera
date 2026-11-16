import { CacheDeLeiturasAsyncStorage } from '@/infraestrutura/persistencia/CacheDeLeiturasAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';

const leitura = { umidadePercentual: 57, temperaturaCelsius: 24.5, luminosidadeLux: null,
  medidaEm: new Date('2026-11-07T12:30:00.000Z') };

test('guarda a última leitura isolada por jardim e restaura a data como Date', async () => {
  const armazenamento = new ArmazenamentoEmMemoria();
  const repo = new CacheDeLeiturasAsyncStorage(armazenamento);
  await repo.salvar('sala 1', leitura);
  expect(await new CacheDeLeiturasAsyncStorage(armazenamento).obter('sala 1')).toEqual(leitura);
  expect(await repo.obter('sala-1')).toBeNull();
});

test.each(['{quebrado', 'null', '{"medidaEm":"inválida"}'])('ignora conteúdo inválido %p', async (bruto) => {
  const armazenamento = new ArmazenamentoEmMemoria({ 'fitosfera:v3:leitura:sala': bruto });
  expect(await new CacheDeLeiturasAsyncStorage(armazenamento).obter('sala')).toBeNull();
});

test('guarda e restaura leituras recentes em ordem cronológica', async () => {
  const armazenamento = new ArmazenamentoEmMemoria();
  const repo = new CacheDeLeiturasAsyncStorage(armazenamento);
  const anterior = { ...leitura, medidaEm: new Date('2026-11-07T12:00:00.000Z') };
  await repo.salvar('sala', leitura);
  await repo.salvar('sala', anterior);
  expect((await repo.obterHistorico('sala')).map((item) => item.medidaEm)).toEqual([
    anterior.medidaEm,
    leitura.medidaEm,
  ]);
  expect((await repo.obter('sala'))?.medidaEm).toEqual(leitura.medidaEm);
});

test('descarta do histórico leituras fora da janela de 24 horas', async () => {
  const repo = new CacheDeLeiturasAsyncStorage(new ArmazenamentoEmMemoria());
  await repo.salvar('sala', leitura);
  await repo.salvar('sala', { ...leitura, medidaEm: new Date('2026-11-06T11:00:00.000Z') });
  expect(await repo.obterHistorico('sala')).toHaveLength(1);
});

test('gravações concorrentes não perdem leituras do histórico', async () => {
  const repo = new CacheDeLeiturasAsyncStorage(new ArmazenamentoEmMemoria());
  const amostras = Array.from({ length: 12 }, (_, indice) => ({
    ...leitura,
    medidaEm: new Date(leitura.medidaEm.getTime() + indice * 60_000),
  }));
  await Promise.all(amostras.map((amostra) => repo.salvar('sala', amostra)));
  expect(await repo.obterHistorico('sala')).toHaveLength(amostras.length);
});

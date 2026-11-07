import { RepositorioDeLeiturasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeLeiturasAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';

const leitura = { umidadePercentual: 57, temperaturaCelsius: 24.5, luminosidadeLux: null,
  medidaEm: new Date('2026-11-07T12:30:00.000Z') };

test('guarda a última leitura isolada por jardim e restaura a data como Date', async () => {
  const armazenamento = new ArmazenamentoEmMemoria();
  const repo = new RepositorioDeLeiturasAsyncStorage(armazenamento);
  await repo.salvar('sala 1', leitura);
  expect(await new RepositorioDeLeiturasAsyncStorage(armazenamento).obter('sala 1')).toEqual(leitura);
  expect(await repo.obter('sala-1')).toBeNull();
});

test.each(['{quebrado', 'null', '{"medidaEm":"inválida"}'])('ignora conteúdo inválido %p', async (bruto) => {
  const armazenamento = new ArmazenamentoEmMemoria({ 'fitosfera:v3:leitura:sala': bruto });
  expect(await new RepositorioDeLeiturasAsyncStorage(armazenamento).obter('sala')).toBeNull();
});

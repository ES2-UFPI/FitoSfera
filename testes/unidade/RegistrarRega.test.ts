import { RegistrarRega } from '@/aplicacao/casos-de-uso/RegistrarRega';
import { RepositorioDeRegasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeRegasAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';
import { RelogioParado, RepositorioDeRegasEmMemoria } from '../apoio/fakes';

const agora = new Date('2026-10-18T18:30:00.000Z');
const gerador = { gerar: () => 'r1' };

test('registra a planta, o identificador e o horário atual', async () => {
  const regas = new RepositorioDeRegasEmMemoria();
  const casoDeUso = new RegistrarRega(regas, gerador, new RelogioParado(agora));

  const registrada = await casoDeUso.executar('p1');

  expect(registrada).toEqual({ id: 'r1', idPlanta: 'p1', regadaEm: agora });
  expect(regas.salvas).toEqual([registrada]);
});

test('a rega continua disponível depois de reabrir o repositório', async () => {
  const armazenamento = new ArmazenamentoEmMemoria();
  const regas = new RepositorioDeRegasAsyncStorage(armazenamento);
  await new RegistrarRega(regas, gerador, new RelogioParado(agora)).executar('p1');

  const reaberto = new RepositorioDeRegasAsyncStorage(armazenamento);
  expect(await reaberto.listarPorPlanta('p1')).toEqual([{ id: 'r1', idPlanta: 'p1', regadaEm: agora }]);
});

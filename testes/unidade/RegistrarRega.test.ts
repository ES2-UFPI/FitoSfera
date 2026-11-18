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

describe('rega de outro dia', () => {
  const agoraLocal = new Date(2026, 10, 17, 18, 30);
  const casoDeUso = (regas = new RepositorioDeRegasEmMemoria()) =>
    new RegistrarRega(regas, gerador, new RelogioParado(agoraLocal));

  test('um dia passado vira o meio-dia daquele dia', async () => {
    const registrada = await casoDeUso().executar('p1', { dia: 15, mes: 11, ano: 2026 });
    expect(registrada.regadaEm).toEqual(new Date(2026, 10, 15, 12));
  });

  test('hoje vale como agora', async () => {
    const registrada = await casoDeUso().executar('p1', { dia: 17, mes: 11, ano: 2026 });
    expect(registrada.regadaEm).toEqual(agoraLocal);
  });

  test('recusa dia no futuro e dia que não existe, sem gravar nada', async () => {
    const regas = new RepositorioDeRegasEmMemoria();
    await expect(casoDeUso(regas).executar('p1', { dia: 18, mes: 11, ano: 2026 })).rejects.toMatchObject({
      motivo: 'data-no-futuro',
    });
    await expect(casoDeUso(regas).executar('p1', { dia: 31, mes: 2, ano: 2026 })).rejects.toMatchObject({
      motivo: 'data-invalida',
    });
    await expect(casoDeUso(regas).executar('p1', 'ilegivel')).rejects.toMatchObject({ motivo: 'data-invalida' });
    expect(regas.salvas).toEqual([]);
  });
});

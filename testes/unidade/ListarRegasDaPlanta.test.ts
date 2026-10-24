import { LIMITE_DO_HISTORICO_DE_REGAS } from '@/aplicacao/casos-de-uso/ListarRegasDaPlanta';
import { criarContainerDeTeste } from '../apoio/fakes';

const agora = new Date(2026, 9, 20, 9, 0);
const rega = (id: string, regadaEm: Date, idPlanta = 'p1') => ({ id, idPlanta, regadaEm });

test('lista as regas da mais recente para a mais antiga, mesmo gravadas fora de ordem', async () => {
  const { container } = criarContainerDeTeste({
    agora,
    regas: [
      rega('r2', new Date(2026, 9, 18, 8, 0)),
      rega('r3', new Date(2026, 9, 19, 18, 30)),
      rega('r1', new Date(2026, 9, 15, 7, 15)),
    ],
  });

  const historico = await container.listarRegas.executar('p1');

  expect(historico.map((item) => item.rega.id)).toEqual(['r3', 'r2', 'r1']);
});

test('conta os dias desde cada rega: 0 hoje, 1 ontem', async () => {
  const { container } = criarContainerDeTeste({
    agora,
    regas: [rega('r1', new Date(2026, 9, 20, 7, 0)), rega('r2', new Date(2026, 9, 19, 22, 0)), rega('r3', new Date(2026, 9, 15, 7, 0))],
  });

  const historico = await container.listarRegas.executar('p1');

  expect(historico.map((item) => item.diasAtras)).toEqual([0, 1, 5]);
});

test(`mostra só as ${LIMITE_DO_HISTORICO_DE_REGAS} regas mais recentes`, async () => {
  const regas = Array.from({ length: 26 }, (_, dia) => rega(`r${dia + 1}`, new Date(2026, 8, dia + 1, 8, 0)));
  const { container } = criarContainerDeTeste({ agora, regas });

  const historico = await container.listarRegas.executar('p1');

  expect(historico).toHaveLength(LIMITE_DO_HISTORICO_DE_REGAS);
  expect(historico[0].rega.id).toBe('r26');
  expect(historico[LIMITE_DO_HISTORICO_DE_REGAS - 1].rega.id).toBe('r7');
});

test('não mistura as regas de outra planta', async () => {
  const { container } = criarContainerDeTeste({
    agora,
    regas: [rega('minha', new Date(2026, 9, 19, 8, 0)), rega('doVizinho', agora, 'p2')],
  });

  expect((await container.listarRegas.executar('p1')).map((item) => item.rega.id)).toEqual(['minha']);
});

test('planta sem nenhuma rega devolve lista vazia', async () => {
  const { container } = criarContainerDeTeste({ agora });

  expect(await container.listarRegas.executar('p1')).toEqual([]);
});

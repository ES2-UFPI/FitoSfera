import { QUANTIDADE_DE_REGAS_RECENTES } from '@/aplicacao/casos-de-uso/ObterHistoricoDaPlanta';
import { criarContainerDeTeste, plantaDeTeste } from '../apoio/fakes';

const agora = new Date(2026, 9, 20, 9, 0);
const rega = (id: string, regadaEm: Date, idPlanta = 'p1') => ({ id, idPlanta, regadaEm });

test('traz a data de cadastro, os dias no jardim e a última rega', async () => {
  const planta = plantaDeTeste({ cadastradaEm: new Date(2026, 9, 17, 14, 0) });
  const { container } = criarContainerDeTeste({
    agora,
    regas: [rega('r1', new Date(2026, 9, 18, 8, 0)), rega('r2', new Date(2026, 9, 19, 18, 30))],
  });

  const historico = await container.obterHistorico.executar(planta);

  expect(historico.cadastradaEm).toEqual(new Date(2026, 9, 17, 14, 0));
  expect(historico.diasNoJardim).toBe(3);
  expect(historico.ultimaRega?.id).toBe('r2');
  expect(historico.regasRecentes.map((r) => r.id)).toEqual(['r2', 'r1']);
});

test(`resume só as ${QUANTIDADE_DE_REGAS_RECENTES} regas mais recentes da própria planta`, async () => {
  const regas = Array.from({ length: 8 }, (_, dia) => rega(`r${dia + 1}`, new Date(2026, 9, dia + 1, 8, 0)));
  const { container } = criarContainerDeTeste({ agora, regas: [...regas, rega('outra', agora, 'p2')] });

  const historico = await container.obterHistorico.executar(plantaDeTeste());

  expect(historico.regasRecentes.map((r) => r.id)).toEqual(['r8', 'r7', 'r6', 'r5', 'r4']);
});

test('planta antiga, sem data de cadastro e sem regas, não quebra', async () => {
  const { container } = criarContainerDeTeste({ agora });

  const historico = await container.obterHistorico.executar(plantaDeTeste({ cadastradaEm: null }));

  expect(historico).toEqual({ cadastradaEm: null, diasNoJardim: null, ultimaRega: null, regasRecentes: [] });
});

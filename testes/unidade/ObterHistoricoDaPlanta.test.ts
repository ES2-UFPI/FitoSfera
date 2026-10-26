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
  expect(historico.diasDesdeAUltimaRega).toBe(1);
  expect(historico.regasRecentes.map((r) => r.id)).toEqual(['r2', 'r1']);
});

test('conta os dias desde a última rega pelo calendário: 0 hoje, 1 ontem', async () => {
  const diasDesdeAUltima = async (regadaEm: Date) =>
    (await criarContainerDeTeste({ agora, regas: [rega('r1', regadaEm)] }).container.obterHistorico.executar(
      plantaDeTeste(),
    )).diasDesdeAUltimaRega;

  // Regada às 23h de ontem já conta como ontem às 9h de hoje, e não como "há poucas horas".
  expect(await diasDesdeAUltima(new Date(2026, 9, 20, 7, 30))).toBe(0);
  expect(await diasDesdeAUltima(new Date(2026, 9, 19, 23, 0))).toBe(1);
  expect(await diasDesdeAUltima(new Date(2026, 9, 18, 8, 0))).toBe(2);
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

  expect(historico).toEqual({
    cadastradaEm: null,
    diasNoJardim: null,
    ultimaRega: null,
    diasDesdeAUltimaRega: null,
    regasRecentes: [],
    proximaRega: { proximaEm: null, diasAteAProxima: null, precisaRegar: false },
  });
});

describe('a próxima rega', () => {
  // As espécies de teste usam intervalo de 3 dias.
  test('conta da última rega, e registrar uma rega adia o prazo', async () => {
    const planta = plantaDeTeste({ cadastradaEm: new Date(2026, 9, 10, 8, 0), intervaloDeRegaEmDias: 3 });
    const comRegaAntiga = criarContainerDeTeste({ agora, regas: [rega('r1', new Date(2026, 9, 15, 8, 0))] });
    const comRegaDeHoje = criarContainerDeTeste({ agora, regas: [rega('r1', new Date(2026, 9, 20, 8, 0))] });

    expect((await comRegaAntiga.container.obterHistorico.executar(planta)).proximaRega).toMatchObject({
      diasAteAProxima: -2,
      precisaRegar: true,
    });
    expect((await comRegaDeHoje.container.obterHistorico.executar(planta)).proximaRega).toMatchObject({
      diasAteAProxima: 3,
      precisaRegar: false,
    });
  });

  test('planta sem rega registrada conta da data de cadastro', async () => {
    const { container } = criarContainerDeTeste({ agora });
    const planta = plantaDeTeste({ cadastradaEm: new Date(2026, 9, 18, 8, 0), intervaloDeRegaEmDias: 3 });

    expect((await container.obterHistorico.executar(planta)).proximaRega.proximaEm).toEqual(
      new Date(2026, 9, 21, 8, 0),
    );
  });

  test('planta antiga, sem o intervalo gravado, usa o da espécie no catálogo', async () => {
    const { container } = criarContainerDeTeste({ agora });
    const antiga = plantaDeTeste({ cadastradaEm: new Date(2026, 9, 18, 8, 0), intervaloDeRegaEmDias: null });

    expect((await container.obterHistorico.executar(antiga)).proximaRega.proximaEm).toEqual(
      new Date(2026, 9, 21, 8, 0),
    );
  });

  test('espécie fora do catálogo deixa a próxima rega desconhecida, sem cobrar', async () => {
    const { container } = criarContainerDeTeste({ agora });
    const orfa = plantaDeTeste({ idEspecie: 'sumiu', cadastradaEm: new Date(2026, 9, 1, 8, 0), intervaloDeRegaEmDias: null });

    expect((await container.obterHistorico.executar(orfa)).proximaRega).toEqual({
      proximaEm: null,
      diasAteAProxima: null,
      precisaRegar: false,
    });
  });

  test('o intervalo gravado na planta vence o do catálogo', async () => {
    const { container } = criarContainerDeTeste({ agora });
    const planta = plantaDeTeste({ cadastradaEm: new Date(2026, 9, 18, 8, 0), intervaloDeRegaEmDias: 10 });

    expect((await container.obterHistorico.executar(planta)).proximaRega.proximaEm).toEqual(
      new Date(2026, 9, 28, 8, 0),
    );
  });
});

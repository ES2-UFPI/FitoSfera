import { RegistroDeColheita, UnidadeDeColheita } from '@/dominio/modelos/RegistroDeColheita';
import {
  calcularRendimento,
  calcularRendimentoPorUnidade,
  PeriodoDeRendimento,
} from '@/dominio/regras/RendimentoDaColheita';

let sequencia = 0;
function colheita(colhidaEm: Date, quantidade: number, unidade: UnidadeDeColheita = 'unidades'): RegistroDeColheita {
  sequencia += 1;
  return { id: `c${sequencia}`, idPlanta: 'tomateiro', quantidade, unidade, colhidaEm };
}

/** Novembro de 2026 inteiro: do primeiro instante do dia 1 ao último do dia 30. */
const novembro: PeriodoDeRendimento = {
  inicio: new Date(2026, 10, 1, 0, 0, 0, 0),
  fim: new Date(2026, 10, 30, 23, 59, 59, 999),
};

describe('calcularRendimento', () => {
  test('soma a quantidade e conta as colheitas dentro do período', () => {
    const registros = [
      colheita(new Date(2026, 10, 3, 9), 5),
      colheita(new Date(2026, 10, 10, 17), 8),
      colheita(new Date(2026, 10, 25, 7), 2),
    ];

    expect(calcularRendimento(registros, novembro, 'unidades')).toEqual({
      unidade: 'unidades',
      quantidadeTotal: 15,
      numeroDeColheitas: 3,
    });
  });

  test('ignora as colheitas de fora do período', () => {
    const registros = [
      colheita(new Date(2026, 9, 31, 20), 100),
      colheita(new Date(2026, 10, 15, 12), 4),
      colheita(new Date(2026, 11, 1, 8), 100),
    ];

    expect(calcularRendimento(registros, novembro, 'unidades')).toMatchObject({
      quantidadeTotal: 4,
      numeroDeColheitas: 1,
    });
  });

  describe('bordas do período', () => {
    test('uma colheita exatamente no início ou no fim conta', () => {
      const registros = [colheita(novembro.inicio, 3), colheita(novembro.fim, 7)];

      expect(calcularRendimento(registros, novembro, 'unidades')).toMatchObject({
        quantidadeTotal: 10,
        numeroDeColheitas: 2,
      });
    });

    test('um milissegundo antes do início ou depois do fim já fica de fora', () => {
      const registros = [
        colheita(new Date(novembro.inicio.getTime() - 1), 3),
        colheita(new Date(novembro.fim.getTime() + 1), 7),
      ];

      expect(calcularRendimento(registros, novembro, 'unidades')).toMatchObject({
        quantidadeTotal: 0,
        numeroDeColheitas: 0,
      });
    });

    test('período de um único instante conta a colheita daquele instante', () => {
      const instante = new Date(2026, 10, 11, 15, 30);
      expect(
        calcularRendimento([colheita(instante, 6)], { inicio: instante, fim: instante }, 'unidades'),
      ).toMatchObject({ quantidadeTotal: 6, numeroDeColheitas: 1 });
    });
  });

  describe('período vazio', () => {
    test('sem nenhum registro, o rendimento é zero, sem erro', () => {
      expect(calcularRendimento([], novembro, 'gramas')).toEqual({
        unidade: 'gramas',
        quantidadeTotal: 0,
        numeroDeColheitas: 0,
      });
    });

    test('com registros, mas nenhum no período, também é zero', () => {
      expect(calcularRendimento([colheita(new Date(2026, 0, 5), 9)], novembro, 'unidades')).toMatchObject({
        quantidadeTotal: 0,
        numeroDeColheitas: 0,
      });
    });

    test('início depois do fim é um período vazio, não um erro', () => {
      const invertido = { inicio: novembro.fim, fim: novembro.inicio };
      expect(calcularRendimento([colheita(new Date(2026, 10, 15), 9)], invertido, 'unidades')).toMatchObject({
        quantidadeTotal: 0,
        numeroDeColheitas: 0,
      });
    });
  });

  describe('unidades diferentes', () => {
    const misturadas = [
      colheita(new Date(2026, 10, 2), 12, 'unidades'),
      colheita(new Date(2026, 10, 4), 300, 'gramas'),
      colheita(new Date(2026, 10, 6), 3, 'unidades'),
      colheita(new Date(2026, 10, 8), 150.5, 'gramas'),
    ];

    test('frutos contados não somam com gramas pesadas', () => {
      expect(calcularRendimento(misturadas, novembro, 'unidades')).toEqual({
        unidade: 'unidades',
        quantidadeTotal: 15,
        numeroDeColheitas: 2,
      });
      expect(calcularRendimento(misturadas, novembro, 'gramas')).toEqual({
        unidade: 'gramas',
        quantidadeTotal: 450.5,
        numeroDeColheitas: 2,
      });
    });

    test('pedir uma unidade sem registros dá zero, mesmo com colheitas da outra', () => {
      const soFrutos = [colheita(new Date(2026, 10, 2), 12, 'unidades')];
      expect(calcularRendimento(soFrutos, novembro, 'gramas')).toMatchObject({
        quantidadeTotal: 0,
        numeroDeColheitas: 0,
      });
    });
  });

  test('a soma de gramas com fração não carrega resto de ponto flutuante', () => {
    const registros = [colheita(new Date(2026, 10, 2), 0.1, 'gramas'), colheita(new Date(2026, 10, 3), 0.2, 'gramas')];
    expect(calcularRendimento(registros, novembro, 'gramas').quantidadeTotal).toBe(0.3);
  });

  test('não altera a lista recebida', () => {
    const registros = Object.freeze([colheita(new Date(2026, 10, 2), 4)]);
    expect(() => calcularRendimento(registros, novembro, 'unidades')).not.toThrow();
    expect(registros).toHaveLength(1);
  });
});

describe('calcularRendimentoPorUnidade', () => {
  test('devolve o rendimento de cada unidade no período, com zero para a que não teve colheita', () => {
    const registros = [
      colheita(new Date(2026, 10, 2), 12, 'unidades'),
      colheita(new Date(2026, 10, 9), 5, 'unidades'),
      colheita(new Date(2026, 9, 20), 400, 'gramas'),
    ];

    expect(calcularRendimentoPorUnidade(registros, novembro)).toEqual({
      unidades: { unidade: 'unidades', quantidadeTotal: 17, numeroDeColheitas: 2 },
      gramas: { unidade: 'gramas', quantidadeTotal: 0, numeroDeColheitas: 0 },
    });
  });
});

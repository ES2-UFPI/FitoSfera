import { calcularLuzDoDia, luxMinutosParaDli } from '@/dominio/regras/LuzDoDia';
import { PeriodoDeLuz } from '@/dominio/regras/LuzRecebida';

/** Lux × minutos que equivalem a 1 mol/m² de luz do sol. */
const UM_MOL = 1_000_000 / (60 * 0.0185);
const META = { minimo: 12, maximo: 16 };

function hora(dia: number, horas: number, minutos = 0): Date {
  return new Date(2026, 10, dia, horas, minutos);
}

function periodo(inicio: Date, fim: Date, mols: number, incompleta = false): PeriodoDeLuz {
  return { inicio, fim, luxMinutos: mols * UM_MOL, incompleta };
}

test('converte lux × minutos em DLI pelo fator da luz do sol', () => {
  expect(luxMinutosParaDli(UM_MOL)).toBeCloseTo(1);
  expect(luxMinutosParaDli(0)).toBe(0);
});

test('soma a luz dos períodos do dia', () => {
  const luz = calcularLuzDoDia({
    periodos: [periodo(hora(10, 8), hora(10, 10), 2), periodo(hora(10, 10), hora(10, 12), 4)],
    conhecidaAte: hora(10, 12),
    meta: META,
    agora: hora(10, 12, 5),
  });
  expect(luz.dli).toBeCloseTo(6);
  expect(luz.incompleta).toBe(false);
});

test('à meia-noite o acumulado do novo dia começa do zero', () => {
  const luz = calcularLuzDoDia({
    periodos: [periodo(hora(9, 9), hora(9, 17), 14), periodo(hora(9, 17), hora(10, 0, 10), 0.01)],
    conhecidaAte: hora(10, 0, 10),
    meta: META,
    agora: hora(10, 0, 15),
  });
  expect(luz.dli).toBeCloseTo(0.01 * (10 / 430));
});

test('período curto que atravessa a meia-noite é dividido pelo tempo entre os dois dias', () => {
  const luz = calcularLuzDoDia({
    periodos: [periodo(hora(9, 23), hora(10, 1), 0.2)],
    conhecidaAte: hora(10, 1),
    meta: META,
    agora: hora(10, 1),
  });
  expect(luz.dli).toBeCloseTo(0.1);
  expect(luz.incompleta).toBe(false);
});

test('período sem contato que atravessa a meia-noite e cobre poucas horas de sol continua completo', () => {
  const luz = calcularLuzDoDia({
    periodos: [periodo(hora(9, 19), hora(10, 8), 1.3)],
    conhecidaAte: hora(10, 8),
    meta: META,
    agora: hora(10, 8),
  });
  expect(luz.dli).toBeCloseTo(1.3 * (8 / 13));
  expect(luz.incompleta).toBe(false);
});

test('período sem contato que atravessa a meia-noite e cobre horas de sol deixa o dia incompleto', () => {
  const luz = calcularLuzDoDia({
    periodos: [periodo(hora(9, 15), hora(10, 11), 5)],
    conhecidaAte: hora(10, 11),
    meta: META,
    agora: hora(10, 11),
  });
  expect(luz.incompleta).toBe(true);
});

test('reinício do sensor no dia deixa o dia incompleto, sem inventar luz', () => {
  const luz = calcularLuzDoDia({
    periodos: [periodo(hora(10, 7), hora(10, 9), 1), periodo(hora(10, 9), hora(10, 11), 0, true)],
    conhecidaAte: hora(10, 11),
    meta: META,
    agora: hora(10, 11),
  });
  expect(luz.dli).toBeCloseTo(1);
  expect(luz.incompleta).toBe(true);
});

test('sem contato recente com o sensor, a luz depois do último contato é desconhecida e o dia fica incompleto', () => {
  const luz = calcularLuzDoDia({
    periodos: [periodo(hora(10, 8), hora(10, 10), 2)],
    conhecidaAte: hora(10, 10),
    meta: META,
    agora: hora(10, 14),
  });
  expect(luz.incompleta).toBe(true);
  expect(luz.conhecidaAte).toEqual(hora(10, 10));
});

test('sem nenhum contato com o sensor, o dia fica incompleto, e não com falta de luz', () => {
  const luz = calcularLuzDoDia({ periodos: [], conhecidaAte: null, meta: META, agora: hora(10, 14) });
  expect(luz).toMatchObject({ dli: 0, incompleta: true, projecaoDli: null, situacaoProjetada: null });
});

describe('progresso e projeção', () => {
  test('o progresso é a luz do dia em relação ao mínimo da meta', () => {
    const luz = calcularLuzDoDia({
      periodos: [periodo(hora(10, 8), hora(10, 12), 6)],
      conhecidaAte: hora(10, 12),
      meta: META,
      agora: hora(10, 12),
    });
    expect(luz.progresso).toBeCloseTo(0.5);
  });

  test('ao meio-dia, metade da luz do dia já passou: a projeção é o dobro do acumulado', () => {
    const luz = calcularLuzDoDia({
      periodos: [periodo(hora(10, 6), hora(10, 12), 7)],
      conhecidaAte: hora(10, 12),
      meta: META,
      agora: hora(10, 12),
    });
    expect(luz.projecaoDli).toBeCloseTo(14);
    expect(luz.situacaoProjetada).toBe('ideal');
  });

  test('cedo demais, a projeção não é feita', () => {
    const luz = calcularLuzDoDia({
      periodos: [periodo(hora(10, 6), hora(10, 7, 30), 0.1)],
      conhecidaAte: hora(10, 7, 30),
      meta: META,
      agora: hora(10, 7, 30),
    });
    expect(luz.projecaoDli).toBeNull();
    expect(luz.situacaoProjetada).toBeNull();
  });

  test('depois do pôr do sol, a projeção é o próprio acumulado', () => {
    const luz = calcularLuzDoDia({
      periodos: [periodo(hora(10, 6), hora(10, 19), 10)],
      conhecidaAte: hora(10, 19),
      meta: META,
      agora: hora(10, 19),
    });
    expect(luz.projecaoDli).toBeCloseTo(10);
    expect(luz.situacaoProjetada).toBe('abaixo');
  });

  test('sem meta, não há progresso nem situação, mas o acumulado continua', () => {
    const luz = calcularLuzDoDia({
      periodos: [periodo(hora(10, 6), hora(10, 12), 8)],
      conhecidaAte: hora(10, 12),
      meta: null,
      agora: hora(10, 12),
    });
    expect(luz).toMatchObject({ progresso: null, situacaoProjetada: null });
    expect(luz.dli).toBeCloseTo(8);
  });
});

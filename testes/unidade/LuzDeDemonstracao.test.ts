import { calcularLuzDoDia } from '@/dominio/regras/LuzDoDia';
import { forjarSol, PASSO_DO_SOL_FORJADO_MS, preencherSolDesdeAs7h } from '@/dominio/regras/LuzDeDemonstracao';
import { MarcaDoContadorDeLuz, PeriodoDeLuz } from '@/dominio/regras/LuzRecebida';

const LUX = 40_000;
const as = (hora: number, minuto = 0, dia = 17) => new Date(2026, 10, dia, hora, minuto);

function periodo(inicio: Date, fim: Date, luxMinutos: number, incompleta = false): PeriodoDeLuz {
  return { inicio, fim, luxMinutos, incompleta };
}

function marca(medidaEm: Date): MarcaDoContadorDeLuz {
  return { idReinicio: 42, luzAcumuladaLuxMinutos: 9_000, medidaEm };
}

function luzForjada(periodos: readonly PeriodoDeLuz[], ate: Date): number {
  return periodos
    .filter((p) => p.inicio.getTime() >= as(7).getTime() && p.fim.getTime() <= ate.getTime())
    .reduce((soma, p) => soma + p.luxMinutos, 0);
}

test('forja sol constante em passos de 5 minutos, com o último passo cortado no fim', () => {
  const periodos = forjarSol(as(7), as(7, 12), LUX);

  expect(periodos.map((p) => p.fim.getTime() - p.inicio.getTime())).toEqual([
    PASSO_DO_SOL_FORJADO_MS, PASSO_DO_SOL_FORJADO_MS, 2 * 60_000,
  ]);
  expect(periodos.reduce((soma, p) => soma + p.luxMinutos, 0)).toBe(LUX * 12);
  expect(periodos.every((p) => !p.incompleta)).toBe(true);
});

test('sensor ligado às 8h: forja das 7h às 8h, mantém a luz medida e tira o reinício do dia', () => {
  const reinicio = periodo(as(20, 0, 16), as(8), 0, true);
  const medidos = [periodo(as(8), as(8, 5), 300), periodo(as(8, 5), as(8, 10), 320)];

  const sol = preencherSolDesdeAs7h({
    marca: marca(as(8, 10)), periodos: [reinicio, ...medidos], agora: as(8, 11), lux: LUX,
  });

  expect(sol.preenchido).toBe(true);
  if (!sol.preenchido) return;
  expect(sol.periodos).not.toContainEqual(reinicio);
  expect(sol.periodos.slice(-2)).toEqual(medidos);
  expect(luzForjada(sol.periodos, as(8))).toBe(LUX * 60);
  const dia = calcularLuzDoDia({ periodos: sol.periodos, conhecidaAte: as(8, 10), meta: null, agora: as(8, 11) });
  expect(dia.incompleta).toBe(false);
});

test('um reinício rápido no meio da luz medida não a interrompe: o sol forjado continua indo só até as 8h', () => {
  const medidos = [
    periodo(as(8), as(8, 5), 300),
    periodo(as(8, 5), as(8, 6), 0, true),
    periodo(as(8, 6), as(8, 10), 250),
  ];

  const sol = preencherSolDesdeAs7h({ marca: marca(as(8, 10)), periodos: medidos, agora: as(8, 11), lux: LUX });

  expect(sol.preenchido).toBe(true);
  if (!sol.preenchido) return;
  expect(sol.periodos.slice(-3)).toEqual(medidos);
  expect(luzForjada(sol.periodos, as(8))).toBe(LUX * 60);
});

test('sensor recém-pareado, ainda sem períodos: forja das 7h até a primeira leitura', () => {
  const sol = preencherSolDesdeAs7h({ marca: marca(as(8, 2)), periodos: [], agora: as(8, 3), lux: LUX });

  expect(sol.preenchido).toBe(true);
  if (sol.preenchido) expect(sol.periodos.reduce((soma, p) => soma + p.luxMinutos, 0)).toBe(LUX * 62);
});

test('a luz completa da véspera fica; o que cruza as 7h e não é medido hoje sai', () => {
  const vespera = periodo(as(14, 0, 16), as(14, 5, 16), 100);
  const cruzaAs7h = periodo(as(6, 58), as(7, 3), 50);

  const sol = preencherSolDesdeAs7h({
    marca: marca(as(8)), periodos: [vespera, cruzaAs7h], agora: as(8, 1), lux: LUX,
  });

  expect(sol.preenchido).toBe(true);
  if (!sol.preenchido) return;
  expect(sol.periodos[0]).toEqual(vespera);
  expect(sol.periodos).not.toContainEqual(cruzaAs7h);
});

test('apertar de novo não forja duas vezes', () => {
  const primeira = preencherSolDesdeAs7h({ marca: marca(as(8)), periodos: [], agora: as(8, 1), lux: LUX });
  if (!primeira.preenchido) throw new Error('deveria ter preenchido');

  expect(preencherSolDesdeAs7h({ marca: marca(as(8)), periodos: primeira.periodos, agora: as(8, 2), lux: LUX }))
    .toEqual({ preenchido: false, motivo: 'ja-preenchido' });
});

test('sem leitura hoje, não forja nada', () => {
  expect(preencherSolDesdeAs7h({ marca: null, periodos: [], agora: as(9), lux: LUX }))
    .toEqual({ preenchido: false, motivo: 'sem-leitura-hoje' });
  expect(preencherSolDesdeAs7h({ marca: marca(as(18, 0, 16)), periodos: [], agora: as(9), lux: LUX }))
    .toEqual({ preenchido: false, motivo: 'sem-leitura-hoje' });
});

test('antes das 7h não há o que forjar', () => {
  expect(preencherSolDesdeAs7h({ marca: marca(as(6, 30)), periodos: [], agora: as(6, 31), lux: LUX }))
    .toEqual({ preenchido: false, motivo: 'antes-das-7h' });
});

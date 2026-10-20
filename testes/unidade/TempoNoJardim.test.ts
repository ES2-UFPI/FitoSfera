import { diasNoJardim } from '@/dominio/regras/TempoNoJardim';

test('no dia do cadastro a planta está há 0 dias no jardim', () => {
  expect(diasNoJardim(new Date(2026, 9, 17, 8, 0), new Date(2026, 9, 17, 22, 0))).toBe(0);
});

test('conta dias de calendário: um cadastro às 23h já vale um dia na manhã seguinte', () => {
  expect(diasNoJardim(new Date(2026, 9, 17, 23, 0), new Date(2026, 9, 18, 7, 0))).toBe(1);
  expect(diasNoJardim(new Date(2026, 9, 1, 12, 0), new Date(2026, 9, 20, 9, 0))).toBe(19);
});

test('atravessa a virada de mês e de ano', () => {
  expect(diasNoJardim(new Date(2025, 11, 31, 10, 0), new Date(2026, 0, 2, 10, 0))).toBe(2);
});

test('planta sem data de cadastro não tem tempo no jardim', () => {
  expect(diasNoJardim(null, new Date(2026, 9, 17))).toBeNull();
});

test('relógio atrasado em relação ao cadastro não gera dias negativos', () => {
  expect(diasNoJardim(new Date(2026, 9, 18, 10, 0), new Date(2026, 9, 17, 10, 0))).toBe(0);
});

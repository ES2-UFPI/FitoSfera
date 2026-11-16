import { formatarData } from '@/apresentacao/formatarData';

describe('formatarData', () => {
  test('formata a data no padrão brasileiro', () => {
    expect(formatarData(new Date(2026, 9, 7, 8, 5))).toBe('07/10/2026');
  });

  test('inclui a hora quando solicitada', () => {
    expect(formatarData(new Date(2026, 9, 7, 8, 5), { comHora: true })).toBe('07/10/2026 às 08:05');
  });

  test('devolve nulo para uma data inválida', () => {
    expect(formatarData(new Date('inválida'))).toBeNull();
  });
});

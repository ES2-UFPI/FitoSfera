import { formatarNumero } from '@/textos';

test('ponto nos milhares e vírgula nos decimais', () => {
  expect(formatarNumero(15000)).toBe('15.000');
  expect(formatarNumero(120000)).toBe('120.000');
  expect(formatarNumero(1500.5)).toBe('1.500,5');
  expect(formatarNumero(25.5)).toBe('25,5');
  expect(formatarNumero(850)).toBe('850');
  expect(formatarNumero(-3.2)).toBe('-3,2');
});

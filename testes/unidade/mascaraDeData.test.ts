import { mascararData } from '@/apresentacao/mascaraDeData';

test('põe as barras enquanto a pessoa digita só números', () => {
  expect(mascararData('1')).toBe('1');
  expect(mascararData('16')).toBe('16');
  expect(mascararData('161')).toBe('16/1');
  expect(mascararData('16/112')).toBe('16/11/2');
  expect(mascararData('16112026')).toBe('16/11/2026');
});

test('não passa de oito dígitos', () => {
  expect(mascararData('161120261')).toBe('16/11/2026');
});

test('respeita as barras que já estão lá, inclusive ao apagar', () => {
  expect(mascararData('16/')).toBe('16/');
  expect(mascararData('5/11/2026')).toBe('5/11/2026');
  expect(mascararData('16/11/2026')).toBe('16/11/2026');
});

test('tira o que não é número', () => {
  expect(mascararData('16-11-2026')).toBe('16/11/2026');
  expect(mascararData('')).toBe('');
});

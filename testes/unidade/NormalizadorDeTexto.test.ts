import { normalizarTexto } from '@/infraestrutura/catalogo/NormalizadorDeTexto';

test.each([
  ['  Espada-de-São-Jorge ', 'espada de sao jorge'],
  ['MANJERICÃO', 'manjericao'],
  ['capim   limão', 'capim limao'],
])('normalizarTexto(%p) = %p', (entrada, saida) => {
  expect(normalizarTexto(entrada)).toBe(saida);
});

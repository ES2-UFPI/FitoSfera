import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { ApelidoInvalido, Planta } from '@/dominio/modelos/Planta';

const base = { id: 'p1', idEspecie: 'tomate', aparencia: APARENCIA_INICIAL };

test('criar apara os espaços do apelido', () => {
  expect(Planta.criar({ ...base, apelido: '  Tomatinho  ' }).apelido).toBe('Tomatinho');
});

test('apelido só com espaços é recusado', () => {
  expect(() => Planta.criar({ ...base, apelido: '   ' })).toThrow(ApelidoInvalido);
});

test('apelido com 30 caracteres passa e com 31 é recusado', () => {
  expect(Planta.criar({ ...base, apelido: 'a'.repeat(30) }).apelido).toHaveLength(30);
  expect(() => Planta.criar({ ...base, apelido: 'a'.repeat(31) })).toThrow(ApelidoInvalido);
});

test('emoji conta como um caractere e acentos são preservados', () => {
  // "Manjericão 🌿" tem 12 caracteres visíveis; com mais 18 chega exatamente ao limite de 30.
  const apelido = 'Manjericão 🌿' + 'x'.repeat(18);
  expect(Planta.criar({ ...base, apelido }).apelido).toBe(apelido);
});

import {
  APARENCIA_INICIAL,
  DESTAQUES,
  FOLHAGENS,
  FORMAS,
  normalizarAparencia,
  VASOS,
} from '@/dominio/modelos/Aparencia';

test('aparência inicial é erva, verde-folha, destaque vermelho e vaso terracota', () => {
  expect(APARENCIA_INICIAL).toEqual({
    forma: 'erva',
    folhagem: 'verde-folha',
    destaque: 'vermelho',
    vaso: 'terracota',
  });
});

test('catálogo tem 8 formas, 8 folhagens, 9 destaques e 6 vasos', () => {
  expect([FORMAS.length, FOLHAGENS.length, DESTAQUES.length, VASOS.length]).toEqual([8, 8, 9, 6]);
});

test('normalizarAparencia mantém ids válidos', () => {
  const aparencia = { forma: 'pendente', folhagem: 'roxo', destaque: 'azul', vaso: 'grafite' };
  expect(normalizarAparencia(aparencia)).toEqual(aparencia);
});

test('normalizarAparencia troca só o campo desconhecido pelo da aparência inicial', () => {
  expect(normalizarAparencia({ forma: 'samambaia', folhagem: 'roxo', destaque: 42 })).toEqual({
    forma: 'erva',
    folhagem: 'roxo',
    destaque: 'vermelho',
    vaso: 'terracota',
  });
});

test.each([null, undefined, 'lixo', 7])('normalizarAparencia(%p) devolve a aparência inicial', (bruta) => {
  expect(normalizarAparencia(bruta)).toEqual({
    forma: 'erva',
    folhagem: 'verde-folha',
    destaque: 'vermelho',
    vaso: 'terracota',
  });
});

import { contarPrateleirasQueCabem, distribuirNaEstante } from '@/apresentacao/estante/distribuirNaEstante';

const P = (indice: number) => ({ tipo: 'planta', indice });
const F = { tipo: 'fantasma' };
const V = { tipo: 'vazio' };

test('1 planta, cabem 3: três prateleiras, fantasma logo depois, sem rolagem', () => {
  expect(distribuirNaEstante(1, 3)).toEqual({
    prateleiras: [
      [P(0), F, V],
      [V, V, V],
      [V, V, V],
    ],
    rolagemLiberada: false,
  });
});

test('8 plantas, cabem 3: o fantasma ocupa o último lugar da tela e nada rola', () => {
  const resultado = distribuirNaEstante(8, 3);
  expect(resultado.prateleiras).toHaveLength(3);
  expect(resultado.prateleiras[2]).toEqual([P(6), P(7), F]);
  expect(resultado.rolagemLiberada).toBe(false);
});

test('9 plantas, cabem 3: o fantasma desce para a 4ª prateleira e a rolagem é liberada', () => {
  const resultado = distribuirNaEstante(9, 3);
  expect(resultado.prateleiras).toHaveLength(4);
  expect(resultado.prateleiras[3]).toEqual([F, V, V]);
  expect(resultado.rolagemLiberada).toBe(true);
});

test('10 plantas, cabem 3: 4ª prateleira com a 10ª planta e o fantasma', () => {
  expect(distribuirNaEstante(10, 3).prateleiras[3]).toEqual([P(9), F, V]);
});

test('tela baixa onde cabe 1: usa o mínimo de 2 e libera a rolagem sempre', () => {
  expect(distribuirNaEstante(2, 1)).toEqual({
    prateleiras: [
      [P(0), P(1), F],
      [V, V, V],
    ],
    rolagemLiberada: true,
  });
});

test('contarPrateleirasQueCabem arredonda para baixo e nunca dá negativo', () => {
  expect(contarPrateleirasQueCabem(600, 190)).toBe(3);
  expect(contarPrateleirasQueCabem(100, 190)).toBe(0);
  expect(contarPrateleirasQueCabem(-40, 190)).toBe(0);
});

import {
  codigoCompleto,
  ContagemDoCodigo,
  contarToque,
  PAUSA_MAXIMA_ENTRE_TOQUES_MS,
  TOQUES_DO_CODIGO,
} from '@/apresentacao/demonstracao/codigoDaDemonstracao';

function tocar(vezes: number, intervaloMs: number, inicio: ContagemDoCodigo | null = null): ContagemDoCodigo {
  let contagem = inicio;
  let agora = inicio?.ultimoToqueEm ?? 0;
  for (let toque = 0; toque < vezes; toque += 1) {
    agora += intervaloMs;
    contagem = contarToque(contagem, agora);
  }
  return contagem!;
}

test(`${TOQUES_DO_CODIGO} toques seguidos completam o código; um a menos, não`, () => {
  expect(codigoCompleto(tocar(TOQUES_DO_CODIGO, 300))).toBe(true);
  expect(codigoCompleto(tocar(TOQUES_DO_CODIGO - 1, 300))).toBe(false);
});

test('uma pausa longa no meio recomeça a contagem', () => {
  const metade = tocar(15, 300);
  const depoisDaPausa = contarToque(metade, metade.ultimoToqueEm + PAUSA_MAXIMA_ENTRE_TOQUES_MS + 1);

  expect(depoisDaPausa.toques).toBe(1);
  expect(codigoCompleto(tocar(5, 300, depoisDaPausa))).toBe(false);
});

/** Quantos toques seguidos no botão Ajustes, na barra de abas, liberam o modo de demonstração. */
export const TOQUES_DO_CODIGO = 20;
/** Uma pausa maior que esta entre dois toques recomeça a contagem. */
export const PAUSA_MAXIMA_ENTRE_TOQUES_MS = 1_500;

export interface ContagemDoCodigo {
  readonly toques: number;
  readonly ultimoToqueEm: number;
}

/** Soma um toque à contagem, ou recomeça dele se a pausa desde o anterior foi longa demais. */
export function contarToque(contagem: ContagemDoCodigo | null, agoraMs: number): ContagemDoCodigo {
  const emSequencia = contagem !== null && agoraMs - contagem.ultimoToqueEm <= PAUSA_MAXIMA_ENTRE_TOQUES_MS;
  return { toques: emSequencia ? contagem.toques + 1 : 1, ultimoToqueEm: agoraMs };
}

export function codigoCompleto(contagem: ContagemDoCodigo): boolean {
  return contagem.toques >= TOQUES_DO_CODIGO;
}

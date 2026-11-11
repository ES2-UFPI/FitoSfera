/**
 * Como a quantidade colhida é medida: em unidades (frutos contados) ou em gramas (pesados). O rendimento só
 * soma registros da mesma unidade, então uma unidade nova entra aqui e passa a valer para todo o app.
 */
export const UNIDADES_DE_COLHEITA = ['unidades', 'gramas'] as const;
export type UnidadeDeColheita = (typeof UNIDADES_DE_COLHEITA)[number];

export function ehUnidadeDeColheita(valor: unknown): valor is UnidadeDeColheita {
  return UNIDADES_DE_COLHEITA.includes(valor as UnidadeDeColheita);
}

/** Uma colheita registrada para uma planta do jardim: quanto, em que unidade e quando. */
export interface RegistroDeColheita {
  readonly id: string;
  readonly idPlanta: string;
  /** Sempre maior que zero; quem grava valida antes (#130). */
  readonly quantidade: number;
  readonly unidade: UnidadeDeColheita;
  readonly colhidaEm: Date;
}

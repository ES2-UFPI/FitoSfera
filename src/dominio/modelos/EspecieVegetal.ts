/** Uma espécie do catálogo. Por enquanto só o que a busca precisa. */
export interface EspecieVegetal {
  readonly id: string;
  readonly nomeComum: string;
  readonly nomeCientifico: string;
  readonly nomesAlternativos: readonly string[];
}

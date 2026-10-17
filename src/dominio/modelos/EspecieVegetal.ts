export const NIVEIS_DE_DIFICULDADE = ['facil', 'medio', 'dificil'] as const;
export type NivelDeDificuldade = (typeof NIVEIS_DE_DIFICULDADE)[number];

/** Faixa ideal de uma grandeza do ambiente, com a referência de onde o valor veio. */
export interface FaixaIdeal {
  readonly minimo: number;
  readonly maximo: number;
  readonly fonte: string;
}

export interface FaixasIdeais {
  /** Umidade relativa do ar, em %. */
  readonly umidadeDoAr: FaixaIdeal;
  /** Temperatura do ar, em °C. */
  readonly temperatura: FaixaIdeal;
  /** Luminosidade, em lux. */
  readonly luminosidade: FaixaIdeal;
}

/** Dias entre o plantio e a primeira colheita. */
export interface CicloAteColheita {
  readonly minimo: number;
  readonly maximo: number;
}

/** Uma espécie do catálogo, com o que a busca, o painel e os lembretes precisam. */
export interface EspecieVegetal {
  readonly id: string;
  readonly nomeComum: string;
  readonly nomeCientifico: string;
  readonly nomesAlternativos: readonly string[];
  /** Caminho de uma imagem embutida no app, ou null enquanto a espécie não tiver foto. */
  readonly foto: string | null;
  readonly faixasIdeais: FaixasIdeais;
  readonly intervaloDeRegaEmDias: number;
  readonly nivelDeDificuldade: NivelDeDificuldade;
  /** null para espécies que não se colhem, como as ornamentais. */
  readonly cicloAteColheitaEmDias: CicloAteColheita | null;
}

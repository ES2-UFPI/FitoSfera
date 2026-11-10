export const NIVEIS_DE_DIFICULDADE = ['facil', 'medio', 'dificil'] as const;
export type NivelDeDificuldade = (typeof NIVEIS_DE_DIFICULDADE)[number];

import type { FaixaRecomendada } from './FaixaRecomendada';

/** Faixa ideal de uma grandeza do ambiente, com a referência de onde o valor veio. */
export interface FaixaIdeal extends FaixaRecomendada {
  readonly fonte: string;
}

export interface FaixasIdeais {
  /** Umidade relativa do ar durante o dia, em %. */
  readonly umidadeDoAr: FaixaIdeal;
  /** Temperatura do ar durante o dia, em °C. */
  readonly temperatura: FaixaIdeal;
  /** Luminosidade num instante, em lux. */
  readonly luminosidade: FaixaIdeal;
  /** Luz somada ao longo do dia (DLI), em mol/m²/dia. */
  readonly luzDiaria: FaixaIdeal;
  /** Umidade relativa do ar durante a noite, em %. */
  readonly umidadeDoArNoturna: FaixaIdeal;
  /** Temperatura do ar durante a noite, em °C. */
  readonly temperaturaNoturna: FaixaIdeal;
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
  /** O catálogo embutido sempre tem as três faixas; null cobre uma espécie que venha sem elas. */
  readonly faixasIdeais: FaixasIdeais | null;
  readonly intervaloDeRegaEmDias: number;
  readonly nivelDeDificuldade: NivelDeDificuldade;
  /** null para espécies que não se colhem, como as ornamentais. */
  readonly cicloAteColheitaEmDias: CicloAteColheita | null;
}

import type { ExigenciasDeManejo } from './ExigenciasDeManejo';
import type { FaixaRecomendada } from './FaixaRecomendada';

/** Em ordem crescente de exigência: a posição no array **é** a escala, e `ordemDaDificuldade` a lê. */
export const NIVEIS_DE_DIFICULDADE = ['facil', 'medio', 'dificil'] as const;
export type NivelDeDificuldade = (typeof NIVEIS_DE_DIFICULDADE)[number];

/**
 * Posição do nível na escala de exigência: 0 fácil, 1 médio, 2 exigente.
 *
 * Existe para quem ordena não precisar saber que a ordem do array é a escala. Reordenar
 * `NIVEIS_DE_DIFICULDADE` muda o resultado de toda ordenação por dificuldade, e é o teste desta função que
 * trava isso.
 */
export function ordemDaDificuldade(nivel: NivelDeDificuldade): number {
  return NIVEIS_DE_DIFICULDADE.indexOf(nivel);
}

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

/** Para frutíferas, dias entre o plantio da muda e a primeira colheita. */
export interface CicloAteColheita {
  readonly minimo: number;
  readonly maximo: number;
}

export interface EstagioDeDesenvolvimento {
  readonly nome: string;
  readonly duracaoEmDias: number;
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
  /**
   * Se a espécie dá frutos, como o tomate e o morango. Só as frutíferas registram colheitas e mostram rendimento
   * (US15). Não é o mesmo que ter ciclo até a colheita: a alface se colhe sem dar fruto.
   */
  readonly frutifera: boolean;
  /** Dias desde o plantio da muda até a primeira colheita; ausente nas não frutíferas. */
  readonly tempoMedioAteColheitaEmDias?: number;
  /** shortcut: durações dos estágios são estimativas, recalibrar com dados por cultivar. */
  readonly estagiosDeDesenvolvimento?: readonly EstagioDeDesenvolvimento[];
  /**
   * Ficha de manejo da espécie, anexada pelo adaptador do catálogo a partir de `exigencias-de-manejo.json`.
   * Ausente ou null quando ninguém pesquisou a ficha — o `catalogo-plantas.json` não traz este campo.
   */
  readonly exigencias?: ExigenciasDeManejo | null;
}

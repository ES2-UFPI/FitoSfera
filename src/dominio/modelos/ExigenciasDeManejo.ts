/**
 * Traços de manejo que tornam a espécie mais trabalhosa. Cada um é um fato verificável em publicação,
 * não um julgamento em escala: a pergunta tem resposta na ficha de cultivo, e a fonte fica registrada.
 */
export interface FatoDeManejo {
  readonly presente: boolean;
  /** Publicação consultada. O mesmo rigor que o catálogo já exige das faixas ideais. */
  readonly fonte: string;
}

export interface ExigenciasDeManejo {
  /**
   * Praga ou doença recorrente que exige intervenção para a planta vingar.
   * Verdadeiro quando a fonte usa verbo de ação obrigatória (controlar, tratar, aplicar);
   * falso quando usa verbo de vigilância (monitorar, observar) ou condicional (pode ocorrer).
   */
  readonly exigeControleDePraga: FatoDeManejo;
  /**
   * Morre por excesso de água: o erro de rega mata mais rápido que a falta.
   * Verdadeiro quando a fonte cita podridão de raiz, apodrecimento ou declínio por rega em excesso.
   * Exigir solo bem drenado, sozinho, não basta — quase toda ficha pede isso.
   */
  readonly morreComEncharcamento: FatoDeManejo;
  /**
   * Poda, desbrota, tutoramento ou amarração necessários para a planta produzir ou não se quebrar.
   * Falso quando a fonte apresenta a poda como escolha de forma, aparência ou colheita.
   */
  readonly exigeManejoEstrutural: FatoDeManejo;
}

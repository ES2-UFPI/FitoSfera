import { FaixasIdeais } from './EspecieVegetal';

/** Intervalo fechado que a planta deve manter; os dois limites contam como dentro. */
export interface FaixaRecomendada {
  readonly minimo: number;
  readonly maximo: number;
}

/** As faixas que a planta guarda: umidade do ar em %, temperatura em °C e luminosidade em lux. */
export interface FaixasRecomendadas {
  readonly umidadeDoAr: FaixaRecomendada;
  readonly temperatura: FaixaRecomendada;
  readonly luminosidade: FaixaRecomendada;
}

/**
 * Cópia das faixas do catálogo para a planta, feita no cadastro. Por ser cópia, revisar o catálogo depois
 * não muda as plantas que já existem. Espécie sem faixa gera planta sem faixa (null), e o cadastro segue.
 */
export function copiarFaixas(faixas: FaixasIdeais | null): FaixasRecomendadas | null {
  if (faixas === null) return null;
  const copiar = ({ minimo, maximo }: FaixaRecomendada): FaixaRecomendada => ({ minimo, maximo });
  return {
    umidadeDoAr: copiar(faixas.umidadeDoAr),
    temperatura: copiar(faixas.temperatura),
    luminosidade: copiar(faixas.luminosidade),
  };
}

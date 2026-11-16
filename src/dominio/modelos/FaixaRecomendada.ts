import { FaixasIdeais } from './EspecieVegetal';

/** Intervalo fechado que a planta deve manter; os dois limites contam como dentro. */
export interface FaixaRecomendada {
  readonly minimo: number;
  readonly maximo: number;
}

/**
 * As faixas que a planta guarda: umidade do ar em % e temperatura em °C durante o dia, e luminosidade em lux.
 * As três últimas existem desde a versão 4 do armazenamento; uma faixa que não dá para ler fica ausente, e quem
 * precisa dela recorre à espécie no catálogo.
 */
export interface FaixasRecomendadas {
  readonly umidadeDoAr: FaixaRecomendada;
  readonly temperatura: FaixaRecomendada;
  readonly luminosidade: FaixaRecomendada;
  /** Luz somada ao longo do dia (DLI), em mol/m²/dia. */
  readonly luzDiaria?: FaixaRecomendada;
  /** Umidade relativa do ar durante a noite, em %. */
  readonly umidadeDoArNoturna?: FaixaRecomendada;
  /** Temperatura do ar durante a noite, em °C. */
  readonly temperaturaNoturna?: FaixaRecomendada;
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
    luzDiaria: copiar(faixas.luzDiaria),
    umidadeDoArNoturna: copiar(faixas.umidadeDoArNoturna),
    temperaturaNoturna: copiar(faixas.temperaturaNoturna),
  };
}

import { FaixaRecomendada, FaixasRecomendadas } from '../modelos/FaixaRecomendada';

/**
 * Um dia de sol simplificado, sem estação nem latitude: claro das 6h às 18h, no horário local. É o mesmo sol que o
 * cálculo da luz do dia usa para projetar o total, e o que decide se uma leitura vale pela faixa do dia ou da noite.
 */
export const NASCER_DO_SOL = 6;
export const POR_DO_SOL = 18;

export function ehNoite(instante: Date): boolean {
  const hora = instante.getHours();
  return hora < NASCER_DO_SOL || hora >= POR_DO_SOL;
}

/** As faixas que valem num momento do dia. Luminosidade null quer dizer que a luz não tem meta naquela hora. */
export interface FaixasDoPeriodo {
  readonly umidadeDoAr: FaixaRecomendada;
  readonly temperatura: FaixaRecomendada;
  readonly luminosidade: FaixaRecomendada | null;
}

/**
 * As faixas que valem na hora da leitura. À noite, temperatura e umidade usam as faixas da noite (ou as do dia, se a
 * planta não tiver as da noite), e a luminosidade fica sem faixa: escuro à noite é o normal, não um desvio. Avisos,
 * selo da estante e painel usam esta mesma regra.
 */
export function faixasDoPeriodo(faixas: FaixasRecomendadas, instante: Date): FaixasDoPeriodo {
  if (!ehNoite(instante)) {
    return { umidadeDoAr: faixas.umidadeDoAr, temperatura: faixas.temperatura, luminosidade: faixas.luminosidade };
  }
  return {
    umidadeDoAr: faixas.umidadeDoArNoturna ?? faixas.umidadeDoAr,
    temperatura: faixas.temperaturaNoturna ?? faixas.temperatura,
    luminosidade: null,
  };
}

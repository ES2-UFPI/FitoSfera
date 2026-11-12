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

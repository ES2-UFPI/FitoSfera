/** Uma rega registrada para uma planta do jardim. */
export interface Rega {
  readonly id: string;
  readonly idPlanta: string;
  readonly regadaEm: Date;
}

/**
 * Política de retenção: cada planta guarda só as regas mais recentes. Ao gravar além disso, as mais antigas
 * são descartadas. Basta para o histórico (#30) e para o lembrete (US08) sem fazer a abertura do app pesar.
 */
export const LIMITE_DE_REGAS_POR_PLANTA = 50;

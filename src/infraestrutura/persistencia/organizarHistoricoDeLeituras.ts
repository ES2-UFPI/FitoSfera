import { Leitura } from '@/dominio/modelos/Leitura';

const JANELA_DO_HISTORICO_MS = 24 * 60 * 60_000;
const LIMITE_DE_LEITURAS_NO_HISTORICO = 2000;

/** Inclui a leitura recebida, remove duplicatas e mantém o histórico recente em ordem cronológica. */
export function organizarHistoricoDeLeituras(
  historico: readonly Leitura[],
  leituraRecebida: Leitura,
  medidaMaisRecenteEm: Date,
): readonly Leitura[] {
  const porInstante = new Map<number, Leitura>();
  for (const item of historico) porInstante.set(item.medidaEm.getTime(), item);
  porInstante.set(leituraRecebida.medidaEm.getTime(), leituraRecebida);
  return [...porInstante.values()]
    .filter((item) => item.medidaEm.getTime() >= medidaMaisRecenteEm.getTime() - JANELA_DO_HISTORICO_MS)
    .sort((a, b) => a.medidaEm.getTime() - b.medidaEm.getTime())
    .slice(-LIMITE_DE_LEITURAS_NO_HISTORICO);
}

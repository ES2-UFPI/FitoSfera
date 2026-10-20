const UM_DIA_MS = 24 * 60 * 60_000;

/**
 * Quantos dias de calendário a planta está no jardim: 0 no dia do cadastro, 1 no dia seguinte, e assim por diante.
 * Conta pela meia-noite local, então um cadastro às 23h já vale um dia na manhã seguinte. Sem data, null.
 */
export function diasNoJardim(cadastradaEm: Date | null, agora: Date): number | null {
  if (cadastradaEm === null) return null;
  const inicio = new Date(cadastradaEm.getFullYear(), cadastradaEm.getMonth(), cadastradaEm.getDate());
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  // Arredonda para absorver o dia de 23 ou 25 horas da troca de horário de verão.
  return Math.max(0, Math.round((hoje.getTime() - inicio.getTime()) / UM_DIA_MS));
}

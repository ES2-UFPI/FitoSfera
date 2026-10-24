const UM_DIA_MS = 24 * 60 * 60_000;

/** Dias de calendário entre dois instantes, contados pela meia-noite local. */
function diasEntre(inicio: Date, fim: Date): number {
  const primeiroDia = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const ultimoDia = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
  // Arredonda para absorver o dia de 23 ou 25 horas da troca de horário de verão.
  return Math.max(0, Math.round((ultimoDia.getTime() - primeiroDia.getTime()) / UM_DIA_MS));
}

/**
 * Quantos dias de calendário a planta está no jardim: 0 no dia do cadastro, 1 no dia seguinte, e assim por diante.
 * Conta pela meia-noite local, então um cadastro às 23h já vale um dia na manhã seguinte. Sem data, null.
 */
export function diasNoJardim(cadastradaEm: Date | null, agora: Date): number | null {
  if (cadastradaEm === null) return null;
  return diasEntre(cadastradaEm, agora);
}

/** Quantos dias de calendário se passaram desde o instante: 0 hoje, 1 ontem, e assim por diante. */
export function diasDesde(instante: Date, agora: Date): number {
  return diasEntre(instante, agora);
}

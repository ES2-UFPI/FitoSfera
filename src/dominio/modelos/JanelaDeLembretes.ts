/** Um horário do dia, em hora (0–23) e minuto (0–59) locais. */
export interface HorarioDoDia {
  readonly hora: number;
  readonly minuto: number;
}

/**
 * A faixa de horas do dia em que o app pode notificar, para o aviso não chegar de madrugada.
 *
 * `fim` antes de `inicio` descreve uma janela que **atravessa a meia-noite** (22:00 às 07:00). `inicio` igual
 * a `fim` libera o dia inteiro. Como nas faixas recomendadas, os dois limites contam como dentro.
 */
export interface JanelaDeLembretes {
  readonly inicio: HorarioDoDia;
  readonly fim: HorarioDoDia;
}

/** Das 8h às 21h: vale enquanto a pessoa não escolher outra, e quando a preferência não dá para ler. */
export const JANELA_PADRAO: JanelaDeLembretes = {
  inicio: { hora: 8, minuto: 0 },
  fim: { hora: 21, minuto: 0 },
};

export function ehHorarioDoDia(valor: unknown): valor is HorarioDoDia {
  if (typeof valor !== 'object' || valor === null) return false;
  const { hora, minuto } = valor as Record<string, unknown>;
  return ehInteiroEntre(hora, 0, 23) && ehInteiroEntre(minuto, 0, 59);
}

function ehInteiroEntre(valor: unknown, minimo: number, maximo: number): boolean {
  return typeof valor === 'number' && Number.isInteger(valor) && valor >= minimo && valor <= maximo;
}

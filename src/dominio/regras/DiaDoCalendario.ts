/** Um dia do calendário, como a pessoa escreve no formulário; o mês vai de 1 a 12. */
export interface DiaDoCalendario {
  readonly dia: number;
  readonly mes: number;
  readonly ano: number;
}

/** Ao meio-dia, um dia passado não muda de data ao ser mostrado em outro fuso. */
const HORA_DE_UM_DIA_PASSADO = 12;

/** O dia do calendário em que `data` cai, no horário local. */
export function diaDoCalendario(data: Date): DiaDoCalendario {
  return { dia: data.getDate(), mes: data.getMonth() + 1, ano: data.getFullYear() };
}

/**
 * O instante que vai para o registro de um dia informado: hoje (ou sem dia) é agora; um dia passado, o meio-dia.
 * A colheita e a rega com data usam a mesma regra.
 */
export function instanteDoDia(
  dia: DiaDoCalendario | 'ilegivel' | undefined,
  agora: Date,
): Date | 'data-invalida' | 'data-no-futuro' {
  if (dia === undefined) return agora;
  if (dia === 'ilegivel' || !existeNoCalendario(dia)) return 'data-invalida';
  if (dia.dia === agora.getDate() && dia.mes === agora.getMonth() + 1 && dia.ano === agora.getFullYear()) return agora;
  const instante = new Date(dia.ano, dia.mes - 1, dia.dia, HORA_DE_UM_DIA_PASSADO);
  return instante.getTime() > agora.getTime() ? 'data-no-futuro' : instante;
}

/** 31/02 ou 00/13 não existem: o Date "corrigiria" para outro dia, e a comparação pega isso. */
function existeNoCalendario({ dia, mes, ano }: DiaDoCalendario): boolean {
  if (![dia, mes, ano].every(Number.isInteger) || ano < 1000) return false;
  const data = new Date(ano, mes - 1, dia);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
}

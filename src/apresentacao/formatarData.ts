export interface OpcoesDeFormatacaoDaData {
  readonly comHora?: boolean;
}

/** Formata datas para exibição no padrão brasileiro e evita mostrar "NaN" quando a data é inválida. */
export function formatarData(data: Date, { comHora = false }: OpcoesDeFormatacaoDaData = {}): string | null {
  if (Number.isNaN(data.getTime())) return null;

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(data);
  if (!comHora) return dataFormatada;

  const horario = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(data);
  return `${dataFormatada} às ${horario}`;
}

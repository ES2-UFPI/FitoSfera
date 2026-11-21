import { TEXTOS } from '@/textos';

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

/**
 * A data já pronta para a tela: quando ela é inválida, entra o texto de reserva no lugar de nada.
 * Quem precisa saber que a data não serve — para esconder a linha inteira, por exemplo — continua
 * usando a `formatarData` e o nulo dela.
 */
export function dataLegivel(data: Date, opcoes?: OpcoesDeFormatacaoDaData): string {
  return formatarData(data, opcoes) ?? TEXTOS.comum.dataDesconhecida;
}

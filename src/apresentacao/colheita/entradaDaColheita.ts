import { DiaDoCalendario } from '@/aplicacao/casos-de-uso/RegistrarColheita';

/**
 * Lê a quantidade como a pessoa escreve: com vírgula ou ponto, e com espaços em volta. Campo vazio vira null, para
 * o caso de uso responder "escreva quanto colheu"; texto que não é número vira NaN, que ele recusa.
 */
export function lerQuantidade(texto: string): number | null {
  const limpo = texto.trim();
  if (limpo === '') return null;
  return /^\d+([.,]\d+)?$/.test(limpo) ? Number(limpo.replace(',', '.')) : Number.NaN;
}

/** "5/11/2026" ou "05/11/2026" viram um dia do calendário; qualquer outra forma é 'ilegivel'. */
export function lerDia(texto: string): DiaDoCalendario | 'ilegivel' {
  const partes = texto.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (partes === null) return 'ilegivel';
  return { dia: Number(partes[1]), mes: Number(partes[2]), ano: Number(partes[3]) };
}

/** O contrário de `lerDia`: o dia como o campo mostra, com dois dígitos no dia e no mês. */
export function escreverDia({ dia, mes, ano }: DiaDoCalendario): string {
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
}

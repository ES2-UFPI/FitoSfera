/** Lê DD/MM/AAAA como data local, recusando datas inexistentes e futuras. */
export function lerDataDePlantio(texto: string, hoje: Date): Date | null | 'invalida' {
  const partes = texto.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (partes === null) return 'invalida';
  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  const ano = Number(partes[3]);
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return 'invalida';
  if (new Date(data.getFullYear(), data.getMonth(), data.getDate()).getTime() >
      new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime()) return 'invalida';
  return data;
}

export function escreverDataDePlantio(data: Date): string {
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
}

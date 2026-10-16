/**
 * Deixa um texto comparável do jeito que a pessoa digita: sem acento, minúsculo,
 * hífen como espaço e sem espaços sobrando. "Espada-de-São-Jorge" vira "espada de sao jorge".
 */
export function normalizarTexto(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

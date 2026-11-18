/**
 * Põe as barras de DD/MM/AAAA enquanto a pessoa digita, para "16112026" virar "16/11/2026". O teclado numérico
 * não tem barra, então a máscara é que a escreve. Texto que já está no formato (com as barras que a pessoa pôs, ou
 * que sobraram ao apagar) fica como está: assim apagar a barra não faz ela voltar no mesmo instante.
 */
export function mascararData(texto: string): string {
  if (/^\d{0,2}(\/\d{0,2}(\/\d{0,4})?)?$/.test(texto)) return texto.includes('/') ? texto : comBarras(texto);
  return comBarras(texto.replace(/\D/g, ''));
}

function comBarras(digitos: string): string {
  const limitados = digitos.slice(0, 8);
  if (limitados.length <= 2) return limitados;
  if (limitados.length <= 4) return `${limitados.slice(0, 2)}/${limitados.slice(2)}`;
  return `${limitados.slice(0, 2)}/${limitados.slice(2, 4)}/${limitados.slice(4)}`;
}

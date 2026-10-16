import { useId } from 'react';

/**
 * Id único por instância para gradientes de SVG. Na web todas as telas montadas dividem o mesmo
 * documento, e um id repetido faz o degradê apontar para o de uma tela escondida.
 */
export function useIdDeSvg(prefixo: string): string {
  return `${prefixo}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}

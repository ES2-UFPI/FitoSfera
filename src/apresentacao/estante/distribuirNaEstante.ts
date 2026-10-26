export const VASOS_POR_PRATELEIRA = 3;
export const MINIMO_DE_PRATELEIRAS = 2;

export type Lugar = { tipo: 'planta'; indice: number } | { tipo: 'fantasma' } | { tipo: 'vazio' };

export interface DistribuicaoDaEstante {
  prateleiras: Lugar[][];
  rolagemLiberada: boolean;
}

/**
 * Coloca as plantas nas prateleiras, na ordem de cadastro, com o vaso fantasma no próximo lugar livre.
 * A tela principal mostra sempre as suas prateleiras (mesmo vazias) e só rola quando todas estão
 * cheias de plantas, ou quando a tela é baixa demais para o mínimo de prateleiras.
 */
export function distribuirNaEstante(quantidadeDePlantas: number, prateleirasQueCabem: number): DistribuicaoDaEstante {
  const prateleirasDaTela = Math.max(MINIMO_DE_PRATELEIRAS, prateleirasQueCabem);
  const capacidadeDaTela = prateleirasDaTela * VASOS_POR_PRATELEIRA;
  const totalDePrateleiras = Math.max(prateleirasDaTela, Math.ceil((quantidadeDePlantas + 1) / VASOS_POR_PRATELEIRA));

  const lugares: Lugar[] = Array.from({ length: totalDePrateleiras * VASOS_POR_PRATELEIRA }, (_, posicao) => {
    if (posicao < quantidadeDePlantas) return { tipo: 'planta', indice: posicao };
    if (posicao === quantidadeDePlantas) return { tipo: 'fantasma' };
    return { tipo: 'vazio' };
  });

  const prateleiras = Array.from({ length: totalDePrateleiras }, (_, i) =>
    lugares.slice(i * VASOS_POR_PRATELEIRA, (i + 1) * VASOS_POR_PRATELEIRA),
  );

  return {
    prateleiras,
    rolagemLiberada: quantidadeDePlantas >= capacidadeDaTela || prateleirasQueCabem < MINIMO_DE_PRATELEIRAS,
  };
}

export function contarPrateleirasQueCabem(alturaDisponivel: number, alturaDaPrateleira: number): number {
  return Math.max(0, Math.floor(alturaDisponivel / alturaDaPrateleira));
}

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PlantaNoJardim } from '@/aplicacao/casos-de-uso/PlantaNoJardim';
import { Container } from '@/composicao/Container';
import { criarContainer } from '@/composicao/criarContainer';

interface ValorDoAplicativo {
  readonly container: Container;
  /** null até a primeira leitura do jardim terminar. */
  readonly plantas: readonly PlantaNoJardim[] | null;
  recarregarJardim(): Promise<void>;
}

const ContextoDoAplicativo = createContext<ValorDoAplicativo | null>(null);

/** Entrega os casos de uso às telas e guarda o jardim carregado, que a estante e a abertura usam. */
export function ProvedorDoAplicativo({
  container: injetado,
  children,
}: {
  container?: Container;
  children: ReactNode;
}) {
  const container = useMemo(() => injetado ?? criarContainer(), [injetado]);
  const [plantas, definirPlantas] = useState<readonly PlantaNoJardim[] | null>(null);

  // Nunca rejeita: se o armazenamento falhar, o app segue com a lista que já tinha (ou vazia na
  // primeira leitura). Sem isso, a abertura esperaria pelo jardim para sempre.
  const recarregarJardim = useCallback(async () => {
    try {
      definirPlantas(await container.listarJardim.executar());
    } catch (falha) {
      console.warn('Não deu para ler o jardim do armazenamento do aparelho.', falha);
      definirPlantas((anteriores) => anteriores ?? []);
    }
  }, [container]);

  useEffect(() => {
    void recarregarJardim();
  }, [recarregarJardim]);

  const valor = useMemo(() => ({ container, plantas, recarregarJardim }), [container, plantas, recarregarJardim]);
  return <ContextoDoAplicativo.Provider value={valor}>{children}</ContextoDoAplicativo.Provider>;
}

export function useAplicativo(): ValorDoAplicativo {
  const valor = useContext(ContextoDoAplicativo);
  if (valor === null) throw new Error('useAplicativo precisa estar dentro de ProvedorDoAplicativo.');
  return valor;
}

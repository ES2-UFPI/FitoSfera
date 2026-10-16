import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Aparencia, APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';

interface Rascunho {
  readonly especie: EspecieVegetal | null;
  readonly aparencia: Aparencia;
  escolherEspecie(especie: EspecieVegetal): void;
  mudarAparencia(parcial: Partial<Aparencia>): void;
}

const ContextoDoRascunho = createContext<Rascunho | null>(null);

/**
 * O que a pessoa já escolheu durante o cadastro. Vive no layout do cadastro: fechar o cadastro
 * descarta tudo, sem rascunho salvo.
 */
export function ProvedorDoRascunho({ children }: { children: ReactNode }) {
  const [especie, definirEspecie] = useState<EspecieVegetal | null>(null);
  const [aparencia, definirAparencia] = useState<Aparencia>(APARENCIA_INICIAL);

  const escolherEspecie = useCallback((escolhida: EspecieVegetal) => definirEspecie(escolhida), []);
  const mudarAparencia = useCallback(
    (parcial: Partial<Aparencia>) => definirAparencia((atual) => ({ ...atual, ...parcial })),
    [],
  );

  const valor = useMemo(
    () => ({ especie, aparencia, escolherEspecie, mudarAparencia }),
    [especie, aparencia, escolherEspecie, mudarAparencia],
  );
  return <ContextoDoRascunho.Provider value={valor}>{children}</ContextoDoRascunho.Provider>;
}

export function useRascunho(): Rascunho {
  const valor = useContext(ContextoDoRascunho);
  if (valor === null) throw new Error('useRascunho precisa estar dentro de ProvedorDoRascunho.');
  return valor;
}

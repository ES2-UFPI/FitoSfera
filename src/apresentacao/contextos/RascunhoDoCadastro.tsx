import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Aparencia, APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { sugerirAparencia } from '@/dominio/regras/AparenciaSugerida';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';

export interface EdicaoDaPlanta {
  readonly idPlanta: string;
  readonly apelido: string;
  readonly plantadaEm: Date | null;
  readonly colheitaIniciada: boolean;
  readonly floracaoIniciadaEm: Date | null;
}

interface Rascunho {
  readonly especie: EspecieVegetal | null;
  readonly aparencia: Aparencia;
  /** Null no cadastro; preenchido quando os passos editam uma planta existente. */
  readonly edicao: EdicaoDaPlanta | null;
  escolherEspecie(especie: EspecieVegetal): void;
  mudarAparencia(parcial: Partial<Aparencia>): void;
}

const ContextoDoRascunho = createContext<Rascunho | null>(null);

/**
 * O que a pessoa já escolheu durante o cadastro. Vive no layout do cadastro: fechar o cadastro
 * descarta tudo, sem rascunho salvo.
 */
export function ProvedorDoRascunho({
  children,
  inicial,
}: {
  children: ReactNode;
  inicial?: { especie: EspecieVegetal | null; aparencia: Aparencia; edicao: EdicaoDaPlanta };
}) {
  const [especie, definirEspecie] = useState<EspecieVegetal | null>(inicial?.especie ?? null);
  const [aparencia, definirAparencia] = useState<Aparencia>(inicial?.aparencia ?? APARENCIA_INICIAL);
  const edicao = inicial?.edicao ?? null;

  // A forma começa pela espécie: quem dá frutos já aparece com frutos parecidos com os seus, e o resto parte da
  // aparência inicial.
  const escolherEspecie = useCallback((escolhida: EspecieVegetal) => {
    definirEspecie(escolhida);
    definirAparencia((atual) => sugerirAparencia(escolhida, atual));
  }, []);
  const mudarAparencia = useCallback(
    (parcial: Partial<Aparencia>) => definirAparencia((atual) => ({ ...atual, ...parcial })),
    [],
  );

  const valor = useMemo(
    () => ({ especie, aparencia, edicao, escolherEspecie, mudarAparencia }),
    [especie, aparencia, edicao, escolherEspecie, mudarAparencia],
  );
  return <ContextoDoRascunho.Provider value={valor}>{children}</ContextoDoRascunho.Provider>;
}

export function useRascunho(): Rascunho {
  const valor = useContext(ContextoDoRascunho);
  if (valor === null) throw new Error('useRascunho precisa estar dentro de ProvedorDoRascunho.');
  return valor;
}

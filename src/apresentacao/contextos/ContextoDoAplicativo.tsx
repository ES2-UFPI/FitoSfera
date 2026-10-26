import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PlantaNoJardim } from '@/aplicacao/casos-de-uso/PlantaNoJardim';
import { Jardim, JARDIM_PRINCIPAL } from '@/dominio/modelos/Jardim';
import { Container } from '@/composicao/Container';
import { criarContainer } from '@/composicao/criarContainer';

interface ValorDoAplicativo {
  readonly container: Container;
  /** null até a primeira leitura do jardim terminar. */
  readonly plantas: readonly PlantaNoJardim[] | null;
  readonly jardins: readonly Jardim[];
  readonly idJardimSelecionado: string;
  selecionarJardim(id: string): Promise<void>;
  criarJardim(nome: string): Promise<void>;
  recarregarJardins(): Promise<void>;
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
  const [jardins, definirJardins] = useState<readonly Jardim[]>([JARDIM_PRINCIPAL]);
  const [idJardimSelecionado, definirSelecionado] = useState(JARDIM_PRINCIPAL.id);
  const selecaoAtual = useRef(JARDIM_PRINCIPAL.id);

  const recarregarJardins = useCallback(async () => {
    const [lista, selecionado] = await Promise.all([
      container.gerenciarJardins.listar(), container.gerenciarJardins.obterSelecionado(),
    ]);
    definirJardins(lista);
    if (selecaoAtual.current !== selecionado) {
      selecaoAtual.current = selecionado;
      definirPlantas(null);
      definirSelecionado(selecionado);
    }
  }, [container]);

  const selecionarJardim = useCallback(async (id: string) => {
    await container.gerenciarJardins.selecionar(id);
    // Escolher o jardim que já está aberto não muda a seleção, então nada recarregaria a estante esvaziada abaixo.
    if (selecaoAtual.current === id) return;
    selecaoAtual.current = id;
    definirPlantas(null);
    definirSelecionado(id);
  }, [container]);

  const criarJardim = useCallback(async (nome: string) => {
    const jardim = await container.gerenciarJardins.criar(nome);
    await recarregarJardins();
    await selecionarJardim(jardim.id);
  }, [container, recarregarJardins, selecionarJardim]);

  // Nunca rejeita: se o armazenamento falhar, o app segue com a lista que já tinha (ou vazia na
  // primeira leitura). Sem isso, a abertura esperaria pelo jardim para sempre.
  const recarregarJardim = useCallback(async () => {
    try {
      const carregadas = await container.listarJardim.executar(idJardimSelecionado);
      if (selecaoAtual.current === idJardimSelecionado) definirPlantas(carregadas);
    } catch (falha) {
      console.warn('Não deu para ler o jardim do armazenamento do aparelho.', falha);
      if (selecaoAtual.current === idJardimSelecionado) definirPlantas((anteriores) => anteriores ?? []);
    }
  }, [container, idJardimSelecionado]);

  useEffect(() => {
    void recarregarJardins().catch((falha) => console.warn('Não deu para ler os jardins.', falha));
  }, [recarregarJardins]);

  useEffect(() => {
    void recarregarJardim();
  }, [recarregarJardim]);

  const valor = useMemo(() => ({
    container, plantas, jardins, idJardimSelecionado, selecionarJardim, criarJardim,
    recarregarJardins, recarregarJardim,
  }), [container, plantas, jardins, idJardimSelecionado, selecionarJardim, criarJardim, recarregarJardins, recarregarJardim]);
  return <ContextoDoAplicativo.Provider value={valor}>{children}</ContextoDoAplicativo.Provider>;
}

export function useAplicativo(): ValorDoAplicativo {
  const valor = useContext(ContextoDoAplicativo);
  if (valor === null) throw new Error('useAplicativo precisa estar dentro de ProvedorDoAplicativo.');
  return valor;
}

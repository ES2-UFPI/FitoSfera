import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PlantaNoJardim } from '@/aplicacao/casos-de-uso/PlantaNoJardim';
import { Jardim, JARDIM_PRINCIPAL } from '@/dominio/modelos/Jardim';
import { Container } from '@/composicao/Container';
import { criarContainer } from '@/composicao/criarContainer';
import { codigoCompleto, ContagemDoCodigo, contarToque } from '../demonstracao/codigoDaDemonstracao';

interface ValorDoAplicativo {
  readonly container: Container;
  /** null até a primeira leitura do jardim terminar. */
  readonly plantas: readonly PlantaNoJardim[] | null;
  readonly jardins: readonly Jardim[];
  readonly idJardimSelecionado: string;
  selecionarJardim(id: string): Promise<void>;
  /**
   * Para um link ou uma notificação de planta de outro jardim: abre o jardim dela. Devolve true quando trocou de
   * jardim (a tela recarrega sozinha com a nova seleção) e false quando a planta não existe ou já está neste.
   */
  abrirJardimDaPlanta(idPlanta: string): Promise<boolean>;
  criarJardim(nome: string): Promise<void>;
  recarregarJardins(): Promise<void>;
  recarregarJardim(): Promise<void>;
  /** A edição avisa que salvou; o detalhe da planta consome o aviso uma vez, ao voltar a aparecer. */
  avisarEdicaoSalva(idPlanta: string): void;
  consumirEdicaoSalva(idPlanta: string): boolean;
  /** Liberado pelo código secreto; só na memória, então fechar o app desliga. */
  readonly modoDeDemonstracao: boolean;
  registrarToqueNaAbaAjustes(): void;
  desligarModoDeDemonstracao(): void;
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
  const recuperacaoDeExclusoes = useRef<Promise<void>>(Promise.resolve());
  // Ref e não estado: o aviso não muda nada na tela por si só, só é lido pelo detalhe ao ganhar foco.
  const edicaoSalva = useRef<string | null>(null);
  const avisarEdicaoSalva = useCallback((idPlanta: string) => { edicaoSalva.current = idPlanta; }, []);
  const consumirEdicaoSalva = useCallback((idPlanta: string) => {
    if (edicaoSalva.current !== idPlanta) return false;
    edicaoSalva.current = null;
    return true;
  }, []);

  const [modoDeDemonstracao, definirModoDeDemonstracao] = useState(false);
  const contagemDoCodigo = useRef<ContagemDoCodigo | null>(null);
  const registrarToqueNaAbaAjustes = useCallback(() => {
    const contagem = contarToque(contagemDoCodigo.current, Date.now());
    contagemDoCodigo.current = contagem;
    if (codigoCompleto(contagem)) {
      contagemDoCodigo.current = null;
      definirModoDeDemonstracao(true);
    }
  }, []);
  const desligarModoDeDemonstracao = useCallback(() => definirModoDeDemonstracao(false), []);

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

  const abrirJardimDaPlanta = useCallback(async (idPlanta: string) => {
    const planta = await container.obterPlanta.executar(idPlanta);
    if (planta === null || planta.planta.idJardim === selecaoAtual.current) return false;
    await selecionarJardim(planta.planta.idJardim);
    return true;
  }, [container, selecionarJardim]);

  const criarJardim = useCallback(async (nome: string) => {
    const jardim = await container.gerenciarJardins.criar(nome);
    await recarregarJardins();
    await selecionarJardim(jardim.id);
  }, [container, recarregarJardins, selecionarJardim]);

  // Nunca rejeita: se o armazenamento falhar, o app segue com a lista que já tinha (ou vazia na
  // primeira leitura). Sem isso, a abertura esperaria pelo jardim para sempre.
  const recarregarJardim = useCallback(async () => {
    try {
      await recuperacaoDeExclusoes.current;
      const carregadas = await container.listarJardim.executar(idJardimSelecionado);
      if (selecaoAtual.current === idJardimSelecionado) definirPlantas(carregadas);
    } catch (falha) {
      console.warn('Não deu para ler o jardim do armazenamento do aparelho.', falha);
      if (selecaoAtual.current === idJardimSelecionado) definirPlantas((anteriores) => anteriores ?? []);
    }
  }, [container, idJardimSelecionado]);

  useEffect(() => {
    recuperacaoDeExclusoes.current = container.excluirPlanta.recuperarPendentes().catch((falha) => {
      console.warn('Não foi possível concluir a limpeza de uma exclusão pendente.', falha);
    });
  }, [container]);

  useEffect(() => {
    void recarregarJardins().catch((falha) => console.warn('Não deu para ler os jardins.', falha));
  }, [recarregarJardins]);

  useEffect(() => {
    void recarregarJardim();
  }, [recarregarJardim]);

  const valor = useMemo(() => ({
    container, plantas, jardins, idJardimSelecionado, selecionarJardim, abrirJardimDaPlanta, criarJardim,
    recarregarJardins, recarregarJardim, avisarEdicaoSalva, consumirEdicaoSalva,
    modoDeDemonstracao, registrarToqueNaAbaAjustes, desligarModoDeDemonstracao,
  }), [container, plantas, jardins, idJardimSelecionado, selecionarJardim, abrirJardimDaPlanta, criarJardim, recarregarJardins, recarregarJardim,
    avisarEdicaoSalva, consumirEdicaoSalva, modoDeDemonstracao, registrarToqueNaAbaAjustes, desligarModoDeDemonstracao]);
  return <ContextoDoAplicativo.Provider value={valor}>{children}</ContextoDoAplicativo.Provider>;
}

export function useAplicativo(): ValorDoAplicativo {
  const valor = useContext(ContextoDoAplicativo);
  if (valor === null) throw new Error('useAplicativo precisa estar dentro de ProvedorDoAplicativo.');
  return valor;
}

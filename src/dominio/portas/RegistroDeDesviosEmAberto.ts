/**
 * Lembra, por planta (id da planta → chave do desvio → visto desde), desde quando cada desvio ainda não avisado vem
 * aparecendo, para medir se ele já durou o bastante. Como a memória de avisos, é estado descartável: perder isto só
 * faz um desvio esperar o tempo mínimo de novo.
 */
export interface RegistroDeDesviosEmAberto {
  listar(): Promise<ReadonlyMap<string, ReadonlyMap<string, Date>>>;
  /** Grava o mapa inteiro: planta que saiu dele não tem desvio em aberto. */
  gravar(desvios: ReadonlyMap<string, ReadonlyMap<string, Date>>): Promise<void>;
}

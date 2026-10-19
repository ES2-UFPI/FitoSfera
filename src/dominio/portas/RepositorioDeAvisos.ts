/**
 * Lembra qual desvio já foi avisado em cada planta (id da planta → assinatura do desvio), para o mesmo
 * desvio ainda não resolvido não notificar de novo. É estado descartável: perder isto só faz um aviso se
 * repetir, nunca apaga dado da pessoa.
 */
export interface RepositorioDeAvisos {
  listar(): Promise<ReadonlyMap<string, string>>;
  /** Grava o mapa inteiro: planta que saiu dele volta a poder ser avisada. */
  gravar(assinaturas: ReadonlyMap<string, string>): Promise<void>;
}

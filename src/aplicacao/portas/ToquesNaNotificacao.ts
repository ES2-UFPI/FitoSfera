/** Um toque numa notificação de desvio: a planta citada e a notificação de onde o toque veio. */
export interface ToqueNaNotificacao {
  readonly idPlanta: string;
  /** Id da notificação; serve para o mesmo toque não ser tratado duas vezes. */
  readonly idDaNotificacao: string;
}

/**
 * O contrato que a interface usa para saber que a pessoa tocou numa notificação. Quem implementa é um
 * adaptador em `infraestrutura/notificacoes/`; só `criarContainer.ts` decide qual entra.
 */
export interface ToquesNaNotificacao {
  /** O toque que abriu o app fechado; null quando a abertura foi comum. */
  toqueQueAbriuOApp(): Promise<ToqueNaNotificacao | null>;
  /** Avisa dos toques que chegam com o app já aberto; devolve como cancelar. */
  aoTocar(ouvinte: (toque: ToqueNaNotificacao) => void): () => void;
}

/** Uma notificação pronta para ser entregue: o texto já montado e a planta a que ela se refere. */
export interface Aviso {
  readonly idPlanta: string;
  readonly titulo: string;
  readonly corpo: string;
}

/**
 * O contrato que o domínio usa para avisar a pessoa fora do app. Quem implementa é um adaptador em
 * `infraestrutura/notificacoes/`; só `criarContainer.ts` decide qual entra.
 */
export interface Notificador {
  /**
   * Garante a permissão de notificar, pedindo na primeira vez. Devolve `false` quando a pessoa recusou,
   * quando não dá para perguntar de novo ou quando o aparelho não tem notificação.
   */
  garantirPermissao(): Promise<boolean>;
  notificar(aviso: Aviso): Promise<void>;
}

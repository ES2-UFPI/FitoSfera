import { MarcaDoContadorDeLuz, PeriodoDeLuz } from '@/dominio/regras/LuzRecebida';

export interface LuzRegistrada {
  readonly marca: MarcaDoContadorDeLuz | null;
  readonly periodos: readonly PeriodoDeLuz[];
}

/** O registro de luz do jardim, visto pelo modo de demonstração: troca os períodos e nunca mexe na marca. */
export interface RegistroDaLuzDeDemonstracao {
  /**
   * Lê o registro e grava os períodos que `alterar` devolver, na mesma fila das leituras do sensor: um pacote que
   * chegue no meio não se perde. Quando `alterar` devolve null, nada é gravado.
   */
  alterarPeriodos(
    idJardim: string,
    alterar: (registro: LuzRegistrada) => readonly PeriodoDeLuz[] | null,
  ): Promise<void>;
}

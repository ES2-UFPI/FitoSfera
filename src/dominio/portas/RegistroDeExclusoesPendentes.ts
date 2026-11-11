/** Diário durável para concluir a limpeza de regas e colheitas se o app fechar durante a exclusão de uma planta. */
export interface RegistroDeExclusoesPendentes {
  marcar(idPlanta: string): Promise<void>;
  listar(): Promise<readonly string[]>;
  remover(idPlanta: string): Promise<void>;
}

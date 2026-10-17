/** O pedaço do AsyncStorage de que o repositório precisa. Em teste, entra uma versão em memória. */
export interface ArmazenamentoChaveValor {
  getItem(chave: string): Promise<string | null>;
  setItem(chave: string, valor: string): Promise<void>;
}

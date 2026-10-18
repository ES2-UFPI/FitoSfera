import { ArmazenamentoChaveValor } from '@/infraestrutura/persistencia/ArmazenamentoChaveValor';

/** AsyncStorage de mentira: um Map que os testes podem inspecionar. */
export class ArmazenamentoEmMemoria implements ArmazenamentoChaveValor {
  readonly valores = new Map<string, string>();

  constructor(iniciais: Record<string, string> = {}) {
    Object.entries(iniciais).forEach(([chave, valor]) => this.valores.set(chave, valor));
  }

  async getItem(chave: string) {
    return this.valores.get(chave) ?? null;
  }

  async setItem(chave: string, valor: string) {
    this.valores.set(chave, valor);
  }

  async removeItem(chave: string) {
    this.valores.delete(chave);
  }
}

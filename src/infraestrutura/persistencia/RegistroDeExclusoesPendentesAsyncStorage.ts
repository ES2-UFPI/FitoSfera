import { RegistroDeExclusoesPendentes } from '@/dominio/portas/RegistroDeExclusoesPendentes';
import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES } from './chaves';

/** Diário pequeno de IDs; conteúdo ilegível bloqueia exclusões em vez de perder pendências silenciosamente. */
export class RegistroDeExclusoesPendentesAsyncStorage implements RegistroDeExclusoesPendentes {
  constructor(private readonly armazenamento: ArmazenamentoChaveValor) {}

  async marcar(idPlanta: string): Promise<void> {
    const ids = await this.ler();
    if (!ids.includes(idPlanta)) await this.gravar([...ids, idPlanta]);
  }

  listar(): Promise<readonly string[]> {
    return this.ler();
  }

  async remover(idPlanta: string): Promise<void> {
    const restantes = (await this.ler()).filter((id) => id !== idPlanta);
    if (restantes.length === 0) await this.armazenamento.removeItem(CHAVES.exclusoesPendentes);
    else await this.gravar(restantes);
  }

  private async ler(): Promise<string[]> {
    const bruto = await this.armazenamento.getItem(CHAVES.exclusoesPendentes);
    if (bruto === null) return [];
    let valor: unknown;
    try {
      valor = JSON.parse(bruto);
    } catch {
      throw new Error('O registro de exclusões pendentes está ilegível.');
    }
    if (!Array.isArray(valor) || !valor.every((id) => typeof id === 'string'))
      throw new Error('O registro de exclusões pendentes está inválido.');
    return [...new Set(valor)];
  }

  private gravar(ids: readonly string[]): Promise<void> {
    return this.armazenamento.setItem(CHAVES.exclusoesPendentes, JSON.stringify(ids));
  }
}

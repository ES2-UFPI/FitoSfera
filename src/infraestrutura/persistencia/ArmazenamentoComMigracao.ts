import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { MigradorDoArmazenamento } from './MigradorDoArmazenamento';

/**
 * Envolve o armazenamento para que a migração rode uma única vez, antes do primeiro acesso, ou seja,
 * quando o app abre e carrega o jardim. Se a migração falhar, o app abre mesmo assim com o que já
 * estiver no formato atual; a versão gravada não avança e a migração é tentada de novo na próxima abertura.
 */
export class ArmazenamentoComMigracao implements ArmazenamentoChaveValor {
  private migracao: Promise<void> | null = null;

  constructor(
    private readonly armazenamento: ArmazenamentoChaveValor,
    private readonly migrador: MigradorDoArmazenamento,
  ) {}

  async getItem(chave: string): Promise<string | null> {
    await this.migrarUmaVez();
    return this.armazenamento.getItem(chave);
  }

  async setItem(chave: string, valor: string): Promise<void> {
    await this.migrarUmaVez();
    return this.armazenamento.setItem(chave, valor);
  }

  private migrarUmaVez(): Promise<void> {
    this.migracao ??= this.migrador.migrar().catch((erro: unknown) => {
      console.warn('Não foi possível migrar os dados salvos; tento de novo na próxima abertura.', erro);
    });
    return this.migracao;
  }
}

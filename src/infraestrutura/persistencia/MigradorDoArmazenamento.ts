import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES, VERSAO_ATUAL_DO_ARMAZENAMENTO } from './chaves';
import { MIGRACOES, Migracao } from './migracoes';

/** Compara a versão gravada com a do app e aplica, em ordem, as migrações que faltam. */
export class MigradorDoArmazenamento {
  private readonly migracoes: readonly Migracao[];

  constructor(
    private readonly armazenamento: ArmazenamentoChaveValor,
    migracoes: readonly Migracao[] = MIGRACOES,
    private readonly versaoAtual: number = VERSAO_ATUAL_DO_ARMAZENAMENTO,
  ) {
    this.migracoes = [...migracoes].sort((a, b) => a.paraVersao - b.paraVersao);
    this.migracoes.forEach((migracao, posicao) => {
      if (migracao.paraVersao !== posicao + 1) throw new Error(`Falta a migração para a versão ${posicao + 1}.`);
    });
    if (this.migracoes.length !== versaoAtual)
      throw new Error(`As migrações vão até a versão ${this.migracoes.length}, mas a atual é ${versaoAtual}.`);
  }

  async migrar(): Promise<void> {
    const gravada = await this.lerVersaoGravada();
    // Dados de uma versão mais nova do app (depois de um downgrade) ficam como estão.
    if (gravada >= this.versaoAtual) return;
    for (const migracao of this.migracoes.slice(gravada)) {
      await migracao.aplicar(this.armazenamento);
      // Gravada a cada passo: se o app fechar no meio, a próxima abertura recomeça do passo que faltou.
      await this.armazenamento.setItem(CHAVES.versao, String(migracao.paraVersao));
    }
  }

  /**
   * Sem versão gravada, os dados são da versão 0 (ou não há dados). Uma versão ilegível também vira 0:
   * as migrações podem rodar de novo sem estrago.
   */
  private async lerVersaoGravada(): Promise<number> {
    const bruto = await this.armazenamento.getItem(CHAVES.versao);
    const versao = Number(bruto);
    return bruto !== null && Number.isInteger(versao) && versao >= 0 ? versao : 0;
  }
}

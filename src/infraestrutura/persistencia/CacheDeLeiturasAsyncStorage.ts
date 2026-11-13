import { Leitura } from '@/dominio/modelos/Leitura';
import { CacheDeLeituras } from '@/dominio/portas/CacheDeLeituras';
import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES } from './chaves';

const JANELA_DO_HISTORICO_MS = 24 * 60 * 60_000;
const LIMITE_DE_LEITURAS_NO_HISTORICO = 2000;

/** Persiste a última leitura e até 24h de histórico por jardim; dados inválidos são ignorados. */
export class CacheDeLeiturasAsyncStorage implements CacheDeLeituras {
  private readonly gravacoesPorJardim = new Map<string, Promise<void>>();

  constructor(private readonly armazenamento: ArmazenamentoChaveValor) {}

  async obter(idJardim: string): Promise<Leitura | null> {
    const bruto = await this.armazenamento.getItem(CHAVES.leituraDoJardim(idJardim));
    return bruto === null ? null : lerLeitura(bruto);
  }

  async obterHistorico(idJardim: string): Promise<readonly Leitura[]> {
    const bruto = await this.armazenamento.getItem(CHAVES.historicoDeLeiturasDoJardim(idJardim));
    if (bruto === null) return [];
    try {
      const valores: unknown = JSON.parse(bruto);
      if (!Array.isArray(valores)) return [];
      return valores
        .map((valor) => lerLeitura(JSON.stringify(valor)))
        .filter((leitura): leitura is Leitura => leitura !== null)
        .sort((a, b) => a.medidaEm.getTime() - b.medidaEm.getTime());
    } catch {
      return [];
    }
  }

  async salvar(idJardim: string, leitura: Leitura): Promise<void> {
    const anterior = this.gravacoesPorJardim.get(idJardim) ?? Promise.resolve();
    const atual = anterior.catch(() => undefined).then(() => this.gravar(idJardim, leitura));
    this.gravacoesPorJardim.set(idJardim, atual);
    try {
      await atual;
    } finally {
      if (this.gravacoesPorJardim.get(idJardim) === atual) this.gravacoesPorJardim.delete(idJardim);
    }
  }

  private async gravar(idJardim: string, leitura: Leitura): Promise<void> {
    const [atual, historico] = await Promise.all([this.obter(idJardim), this.obterHistorico(idJardim)]);
    const maisRecente = atual && atual.medidaEm.getTime() > leitura.medidaEm.getTime() ? atual : leitura;
    const porInstante = new Map<number, Leitura>();
    for (const item of historico) porInstante.set(item.medidaEm.getTime(), item);
    porInstante.set(leitura.medidaEm.getTime(), leitura);
    const recentes = [...porInstante.values()]
      .filter((item) => item.medidaEm.getTime() >= maisRecente.medidaEm.getTime() - JANELA_DO_HISTORICO_MS)
      .sort((a, b) => a.medidaEm.getTime() - b.medidaEm.getTime())
      .slice(-LIMITE_DE_LEITURAS_NO_HISTORICO);
    await Promise.all([
      this.armazenamento.setItem(CHAVES.leituraDoJardim(idJardim), JSON.stringify(maisRecente)),
      this.armazenamento.setItem(CHAVES.historicoDeLeiturasDoJardim(idJardim), JSON.stringify(recentes)),
    ]);
  }
}

function lerLeitura(bruto: string): Leitura | null {
  try {
    const valor: unknown = JSON.parse(bruto);
    if (!ehRegistro(valor) || typeof valor.medidaEm !== 'string') return null;
    const medidaEm = new Date(valor.medidaEm);
    if (!Number.isFinite(medidaEm.getTime())) return null;
    if (typeof valor.umidadePercentual !== 'number' || typeof valor.temperaturaCelsius !== 'number') return null;
    if (valor.luminosidadeLux !== null && typeof valor.luminosidadeLux !== 'number') return null;
    return {
      umidadePercentual: valor.umidadePercentual,
      temperaturaCelsius: valor.temperaturaCelsius,
      luminosidadeLux: valor.luminosidadeLux,
      medidaEm,
    };
  } catch {
    return null;
  }
}

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

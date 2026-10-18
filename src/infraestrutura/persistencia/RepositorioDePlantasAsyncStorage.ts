import { Planta } from '@/dominio/modelos/Planta';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';
import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES } from './chaves';
import { deRegistro, paraRegistro } from './MapeadorDePlanta';

type Leitura = { tipo: 'vazia' } | { tipo: 'lista'; registros: unknown[] } | { tipo: 'ilegivel'; bruto: string };

/** Guarda o jardim como um array JSON, na ordem de cadastro, no armazenamento do aparelho. */
export class RepositorioDePlantasAsyncStorage implements RepositorioDePlantas {
  constructor(private readonly armazenamento: ArmazenamentoChaveValor) {}

  async listar(): Promise<readonly Planta[]> {
    const leitura = await this.ler();
    if (leitura.tipo !== 'lista') return [];
    return leitura.registros.map(deRegistro).filter((planta): planta is Planta => planta !== null);
  }

  async obterPorId(id: string): Promise<Planta | null> {
    return (await this.listar()).find((planta) => planta.id === id) ?? null;
  }

  /**
   * Acrescenta ao array bruto, sem passar pela leitura: registros que o app não entende continuam
   * gravados como estavam. Conteúdo que nem é uma lista ganha uma cópia antes de ser sobrescrito.
   */
  async adicionar(planta: Planta): Promise<void> {
    const leitura = await this.ler();
    if (leitura.tipo === 'ilegivel') await this.armazenamento.setItem(CHAVES.plantasIlegiveis, leitura.bruto);
    const registros = leitura.tipo === 'lista' ? leitura.registros : [];
    await this.armazenamento.setItem(CHAVES.plantas, JSON.stringify([...registros, paraRegistro(planta)]));
  }

  /** Tira só o registro do id; registros que o app não entende continuam gravados. Conteúdo ilegível fica como está. */
  async remover(id: string): Promise<void> {
    const leitura = await this.ler();
    if (leitura.tipo !== 'lista') return;
    const restantes = leitura.registros.filter((registro) => idDoRegistro(registro) !== id);
    if (restantes.length !== leitura.registros.length)
      await this.armazenamento.setItem(CHAVES.plantas, JSON.stringify(restantes));
  }

  private async ler(): Promise<Leitura> {
    const bruto = await this.armazenamento.getItem(CHAVES.plantas);
    if (bruto === null) return { tipo: 'vazia' };
    try {
      const conteudo: unknown = JSON.parse(bruto);
      return Array.isArray(conteudo) ? { tipo: 'lista', registros: conteudo } : { tipo: 'ilegivel', bruto };
    } catch {
      return { tipo: 'ilegivel', bruto };
    }
  }
}

function idDoRegistro(registro: unknown): unknown {
  return typeof registro === 'object' && registro !== null ? (registro as { id?: unknown }).id : undefined;
}

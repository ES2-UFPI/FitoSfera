import { Planta } from '@/dominio/modelos/Planta';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';
import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { deRegistro, paraRegistro } from './MapeadorDePlanta';

export const CHAVE_DAS_PLANTAS = '@fitosfera/plantas';
/** Onde vai parar um conteúdo que não deu para ler, antes de a chave principal ser sobrescrita. */
export const CHAVE_DO_CONTEUDO_ILEGIVEL = `${CHAVE_DAS_PLANTAS}:ilegivel`;

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
    if (leitura.tipo === 'ilegivel') await this.armazenamento.setItem(CHAVE_DO_CONTEUDO_ILEGIVEL, leitura.bruto);
    const registros = leitura.tipo === 'lista' ? leitura.registros : [];
    await this.armazenamento.setItem(CHAVE_DAS_PLANTAS, JSON.stringify([...registros, paraRegistro(planta)]));
  }

  private async ler(): Promise<Leitura> {
    const bruto = await this.armazenamento.getItem(CHAVE_DAS_PLANTAS);
    if (bruto === null) return { tipo: 'vazia' };
    try {
      const conteudo: unknown = JSON.parse(bruto);
      return Array.isArray(conteudo) ? { tipo: 'lista', registros: conteudo } : { tipo: 'ilegivel', bruto };
    } catch {
      return { tipo: 'ilegivel', bruto };
    }
  }
}

import { LIMITE_DE_REGAS_POR_PLANTA, Rega } from '@/dominio/modelos/Rega';
import { RepositorioDeRegas } from '@/dominio/portas/RepositorioDeRegas';
import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES } from './chaves';

/** O que vai para o armazenamento: o id da planta já está na chave. */
interface RegistroDeRega {
  id: string;
  regadaEm: string;
}

type Leitura = { tipo: 'lista'; regas: Rega[] } | { tipo: 'ilegivel'; bruto: string };

/**
 * Guarda as regas numa chave por planta (`fitosfera:v2:regas:<idPlanta>`), da mais recente para a mais antiga,
 * com no máximo `LIMITE_DE_REGAS_POR_PLANTA` regas. O excedente é podado na gravação.
 */
export class RepositorioDeRegasAsyncStorage implements RepositorioDeRegas {
  constructor(private readonly armazenamento: ArmazenamentoChaveValor) {}

  async gravar(rega: Rega): Promise<void> {
    const leitura = await this.ler(rega.idPlanta);
    if (leitura.tipo === 'ilegivel')
      await this.armazenamento.setItem(CHAVES.regasIlegiveisDaPlanta(rega.idPlanta), leitura.bruto);
    const anteriores = leitura.tipo === 'lista' ? leitura.regas : [];
    // Ordena pela data, não pela ordem de gravação: uma rega registrada com atraso não empurra uma recente para fora.
    const mantidas = [...anteriores, rega]
      .sort((a, b) => b.regadaEm.getTime() - a.regadaEm.getTime())
      .slice(0, LIMITE_DE_REGAS_POR_PLANTA);
    await this.armazenamento.setItem(CHAVES.regasDaPlanta(rega.idPlanta), JSON.stringify(mantidas.map(paraRegistro)));
  }

  async listarPorPlanta(idPlanta: string): Promise<readonly Rega[]> {
    const leitura = await this.ler(idPlanta);
    return leitura.tipo === 'lista' ? leitura.regas : [];
  }

  async apagarDaPlanta(idPlanta: string): Promise<void> {
    await this.armazenamento.removeItem(CHAVES.regasDaPlanta(idPlanta));
    await this.armazenamento.removeItem(CHAVES.regasIlegiveisDaPlanta(idPlanta));
  }

  /** Registros que não dá para ler ficam de fora da lista (e somem na próxima poda). */
  private async ler(idPlanta: string): Promise<Leitura> {
    const bruto = await this.armazenamento.getItem(CHAVES.regasDaPlanta(idPlanta));
    if (bruto === null) return { tipo: 'lista', regas: [] };
    try {
      const conteudo: unknown = JSON.parse(bruto);
      if (!Array.isArray(conteudo)) return { tipo: 'ilegivel', bruto };
      const regas = conteudo
        .map((registro) => deRegistro(registro, idPlanta))
        .filter((rega): rega is Rega => rega !== null)
        .sort((a, b) => b.regadaEm.getTime() - a.regadaEm.getTime());
      return { tipo: 'lista', regas };
    } catch {
      return { tipo: 'ilegivel', bruto };
    }
  }
}

function paraRegistro(rega: Rega): RegistroDeRega {
  return { id: rega.id, regadaEm: rega.regadaEm.toISOString() };
}

function deRegistro(bruto: unknown, idPlanta: string): Rega | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const { id, regadaEm } = bruto as Record<string, unknown>;
  if (typeof id !== 'string' || typeof regadaEm !== 'string') return null;
  const data = new Date(regadaEm);
  return Number.isNaN(data.getTime()) ? null : { id, idPlanta, regadaEm: data };
}

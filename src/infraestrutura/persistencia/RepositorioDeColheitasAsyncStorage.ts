import { ehUnidadeDeColheita, RegistroDeColheita, UnidadeDeColheita } from '@/dominio/modelos/RegistroDeColheita';
import { RepositorioDeColheitas } from '@/dominio/portas/RepositorioDeColheitas';
import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES } from './chaves';

/** O que vai para o armazenamento: o id da planta já está na chave. */
interface RegistroGravado {
  id: string;
  quantidade: number;
  unidade: UnidadeDeColheita;
  colhidaEm: string;
}

type Leitura = { tipo: 'lista'; registros: RegistroDeColheita[] } | { tipo: 'ilegivel'; bruto: string };

const maisRecentePrimeiro = (a: RegistroDeColheita, b: RegistroDeColheita) =>
  b.colhidaEm.getTime() - a.colhidaEm.getTime();

/**
 * Guarda as colheitas numa chave por planta (`fitosfera:v4:colheitas:<idPlanta>`), da mais recente para a mais
 * antiga. Sem poda: o histórico e o rendimento precisam de todas.
 */
export class RepositorioDeColheitasAsyncStorage implements RepositorioDeColheitas {
  constructor(private readonly armazenamento: ArmazenamentoChaveValor) {}

  async gravar(registro: RegistroDeColheita): Promise<void> {
    const leitura = await this.ler(registro.idPlanta);
    if (leitura.tipo === 'ilegivel')
      await this.armazenamento.setItem(CHAVES.colheitasIlegiveisDaPlanta(registro.idPlanta), leitura.bruto);
    const anteriores = leitura.tipo === 'lista' ? leitura.registros : [];
    // Gravar de novo o mesmo id substitui o registro, em vez de duplicar a colheita.
    const mantidas = [...anteriores.filter((anterior) => anterior.id !== registro.id), registro].sort(
      maisRecentePrimeiro,
    );
    await this.armazenamento.setItem(
      CHAVES.colheitasDaPlanta(registro.idPlanta),
      JSON.stringify(mantidas.map(paraRegistro)),
    );
  }

  async listarPorPlanta(idPlanta: string): Promise<readonly RegistroDeColheita[]> {
    const leitura = await this.ler(idPlanta);
    return leitura.tipo === 'lista' ? leitura.registros : [];
  }

  async apagarDaPlanta(idPlanta: string): Promise<void> {
    await this.armazenamento.removeItem(CHAVES.colheitasDaPlanta(idPlanta));
    await this.armazenamento.removeItem(CHAVES.colheitasIlegiveisDaPlanta(idPlanta));
  }

  /** Registros que não dá para ler ficam de fora da lista e somem na próxima gravação da planta. */
  private async ler(idPlanta: string): Promise<Leitura> {
    const bruto = await this.armazenamento.getItem(CHAVES.colheitasDaPlanta(idPlanta));
    if (bruto === null) return { tipo: 'lista', registros: [] };
    try {
      const conteudo: unknown = JSON.parse(bruto);
      if (!Array.isArray(conteudo)) return { tipo: 'ilegivel', bruto };
      const registros = conteudo
        .map((gravado) => deRegistro(gravado, idPlanta))
        .filter((registro): registro is RegistroDeColheita => registro !== null)
        .sort(maisRecentePrimeiro);
      return { tipo: 'lista', registros };
    } catch {
      return { tipo: 'ilegivel', bruto };
    }
  }
}

function paraRegistro(registro: RegistroDeColheita): RegistroGravado {
  return {
    id: registro.id,
    quantidade: registro.quantidade,
    unidade: registro.unidade,
    colhidaEm: registro.colhidaEm.toISOString(),
  };
}

/** Quantidade que não é positiva, unidade desconhecida ou data ilegível: o registro não entra no rendimento. */
function deRegistro(bruto: unknown, idPlanta: string): RegistroDeColheita | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const { id, quantidade, unidade, colhidaEm } = bruto as Record<string, unknown>;
  if (typeof id !== 'string' || typeof colhidaEm !== 'string') return null;
  if (typeof quantidade !== 'number' || !Number.isFinite(quantidade) || quantidade <= 0) return null;
  if (!ehUnidadeDeColheita(unidade)) return null;
  const data = new Date(colhidaEm);
  return Number.isNaN(data.getTime()) ? null : { id, idPlanta, quantidade, unidade, colhidaEm: data };
}

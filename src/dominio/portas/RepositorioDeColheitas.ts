import { RegistroDeColheita } from '../modelos/RegistroDeColheita';

/**
 * Onde ficam as colheitas de cada planta. Diferente das regas, não há limite: o histórico (#133) lista todas e o
 * rendimento (#132) soma qualquer período.
 */
export interface RepositorioDeColheitas {
  gravar(registro: RegistroDeColheita): Promise<void>;
  /** Da colheita mais recente para a mais antiga; planta sem colheitas devolve lista vazia. */
  listarPorPlanta(idPlanta: string): Promise<readonly RegistroDeColheita[]>;
  /** Apaga todas as colheitas da planta; usado quando ela sai do jardim. */
  apagarDaPlanta(idPlanta: string): Promise<void>;
}

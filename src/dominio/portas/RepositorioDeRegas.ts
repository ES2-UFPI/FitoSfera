import { Rega } from '../modelos/Rega';

export interface RepositorioDeRegas {
  /** Grava a rega e descarta as mais antigas da planta além de `LIMITE_DE_REGAS_POR_PLANTA`. */
  gravar(rega: Rega): Promise<void>;
  /** Da rega mais recente para a mais antiga. */
  listarPorPlanta(idPlanta: string): Promise<readonly Rega[]>;
  /** Apaga todas as regas da planta; usado quando ela sai do jardim. */
  apagarDaPlanta(idPlanta: string): Promise<void>;
}

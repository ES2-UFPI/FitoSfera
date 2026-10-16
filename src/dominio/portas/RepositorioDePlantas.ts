import { Planta } from '../modelos/Planta';

export interface RepositorioDePlantas {
  /** Na ordem em que as plantas foram cadastradas. */
  listar(): Promise<readonly Planta[]>;
  obterPorId(id: string): Promise<Planta | null>;
  adicionar(planta: Planta): Promise<void>;
}

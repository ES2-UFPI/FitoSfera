import { Planta } from '../modelos/Planta';

export interface RepositorioDePlantas {
  /** Na ordem em que as plantas foram cadastradas. */
  listar(): Promise<readonly Planta[]>;
  obterPorId(id: string): Promise<Planta | null>;
  /** Consulta estrita usada pela recuperação: deve falhar se não puder distinguir ausência de dado ilegível. */
  existe(id: string): Promise<boolean>;
  adicionar(planta: Planta): Promise<void>;
  /** Substitui a planta de mesmo id, mantendo a posição dela no jardim. */
  atualizar(planta: Planta): Promise<void>;
  /** Tira a planta do jardim. Id inexistente não é erro. */
  remover(id: string): Promise<void>;
}

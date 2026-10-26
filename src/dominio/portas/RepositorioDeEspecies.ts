import { EspecieVegetal } from '../modelos/EspecieVegetal';

/** Só leitura: a pessoa não edita o catálogo. */
export interface RepositorioDeEspecies {
  /** Em ordem alfabética do nome comum. */
  listarTodas(): Promise<readonly EspecieVegetal[]>;
  obterPorId(id: string): Promise<EspecieVegetal | null>;
  /** Termo vazio devolve todas, em ordem alfabética. */
  pesquisar(termo: string): Promise<readonly EspecieVegetal[]>;
}

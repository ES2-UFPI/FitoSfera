import { Jardim } from '../modelos/Jardim';

export interface RepositorioDeJardins {
  listar(): Promise<readonly Jardim[]>;
  obterSelecionado(): Promise<string>;
  salvar(jardim: Jardim): Promise<void>;
  selecionar(id: string): Promise<void>;
}

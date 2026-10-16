import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';

export class PesquisarEspecies {
  constructor(private readonly especies: RepositorioDeEspecies) {}

  async executar(termo: string): Promise<readonly EspecieVegetal[]> {
    return this.especies.pesquisar(termo.trim());
  }
}

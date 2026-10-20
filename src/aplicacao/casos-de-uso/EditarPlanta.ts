import { Aparencia } from '@/dominio/modelos/Aparencia';
import { Planta } from '@/dominio/modelos/Planta';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';

export class PlantaNaoEncontrada extends Error {
  constructor(id: string) {
    super(`A planta "${id}" não está mais no jardim.`);
    this.name = 'PlantaNaoEncontrada';
  }
}

/** Troca apelido e aparência; as regas ficam em outro repositório e não são tocadas. */
export class EditarPlanta {
  constructor(private readonly plantas: RepositorioDePlantas) {}

  async executar(id: string, alteracoes: { apelido: string; aparencia: Aparencia }): Promise<Planta> {
    const atual = await this.plantas.obterPorId(id);
    if (atual === null) throw new PlantaNaoEncontrada(id);
    const editada = atual.editar(alteracoes);
    await this.plantas.atualizar(editada);
    return editada;
  }
}

import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';
import { RepositorioDeRegas } from '@/dominio/portas/RepositorioDeRegas';

/** Tira a planta do jardim junto com as regas dela, para não sobrar histórico sem dona no armazenamento. */
export class ExcluirPlanta {
  constructor(
    private readonly plantas: RepositorioDePlantas,
    private readonly regas: RepositorioDeRegas,
  ) {}

  /**
   * As regas saem primeiro: se a remoção da planta falhar, ela continua no jardim (só sem histórico),
   * em vez de sobrarem regas de uma planta que não existe mais.
   */
  async executar(idPlanta: string): Promise<void> {
    await this.regas.apagarDaPlanta(idPlanta);
    await this.plantas.remover(idPlanta);
  }
}

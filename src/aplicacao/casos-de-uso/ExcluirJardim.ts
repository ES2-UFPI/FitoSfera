import { JARDIM_PRINCIPAL } from '@/dominio/modelos/Jardim';
import { RepositorioDeJardins } from '@/dominio/portas/RepositorioDeJardins';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';
import { TEXTOS } from '@/textos';
import { ExcluirPlanta } from './ExcluirPlanta';

/**
 * Exclui um jardim junto com as plantas dele. Cada planta sai pela mesma exclusão do detalhe, que leva as regas,
 * as colheitas e os lembretes; o jardim só sai depois, para uma falha no meio não deixar plantas sem jardim.
 * O jardim principal fica: é para onde o app volta quando o jardim aberto some.
 */
export class ExcluirJardim {
  constructor(
    private readonly jardins: RepositorioDeJardins,
    private readonly plantas: Pick<RepositorioDePlantas, 'listar'>,
    private readonly excluirPlanta: Pick<ExcluirPlanta, 'executar'>,
  ) {}

  async executar(idJardim: string): Promise<void> {
    if (idJardim === JARDIM_PRINCIPAL.id) throw new Error(TEXTOS.jardins.principalNaoSai);
    for (const planta of await this.plantas.listar()) {
      if (planta.idJardim === idJardim) await this.excluirPlanta.executar(planta.id);
    }
    await this.jardins.remover(idJardim);
  }
}

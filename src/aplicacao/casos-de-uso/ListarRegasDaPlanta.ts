import { Rega } from '@/dominio/modelos/Rega';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeRegas } from '@/dominio/portas/RepositorioDeRegas';
import { diasDesde } from '@/dominio/regras/TempoNoJardim';

/** Quantas regas a tela de histórico mostra. O resto fica guardado, mas fora da lista. */
export const LIMITE_DO_HISTORICO_DE_REGAS = 20;

/** Uma rega do histórico já com a distância até hoje, para a tela não precisar de relógio. */
export interface RegaDoHistorico {
  readonly rega: Rega;
  /** 0 para uma rega de hoje, 1 para ontem, e assim por diante. */
  readonly diasAtras: number;
}

/** O histórico de regas de uma planta, da mais recente para a mais antiga. */
export class ListarRegasDaPlanta {
  constructor(
    private readonly regas: RepositorioDeRegas,
    private readonly relogio: Relogio,
  ) {}

  async executar(idPlanta: string): Promise<readonly RegaDoHistorico[]> {
    const regas = await this.regas.listarPorPlanta(idPlanta);
    const agora = this.relogio.agora();
    // Ordena aqui também: a ordem é critério de aceite da tela, não pode depender do repositório.
    return [...regas]
      .sort((uma, outra) => outra.regadaEm.getTime() - uma.regadaEm.getTime())
      .slice(0, LIMITE_DO_HISTORICO_DE_REGAS)
      .map((rega) => ({ rega, diasAtras: diasDesde(rega.regadaEm, agora) }));
  }
}

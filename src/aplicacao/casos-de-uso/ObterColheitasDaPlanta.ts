import { RegistroDeColheita, UnidadeDeColheita } from '@/dominio/modelos/RegistroDeColheita';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeColheitas } from '@/dominio/portas/RepositorioDeColheitas';
import {
  calcularRendimentoPorUnidade,
  PeriodoDeRendimento,
  periodoDosUltimosDias,
  Rendimento,
} from '@/dominio/regras/RendimentoDaColheita';

/** O indicador da tela da planta olha o último mês: curto o bastante para mudar, longo para juntar colheitas. */
export const DIAS_DO_INDICADOR_DE_RENDIMENTO = 30;

export interface ColheitasDaPlanta {
  /** Todas as colheitas da planta, da mais recente para a mais antiga. */
  readonly registros: readonly RegistroDeColheita[];
  readonly periodo: PeriodoDeRendimento;
  /** O rendimento do período em cada unidade; unidade sem colheita no período vem zerada. */
  readonly rendimento: Record<UnidadeDeColheita, Rendimento>;
}

/** O histórico de colheitas da planta e o indicador de rendimento do último mês, para a tela da planta (#133). */
export class ObterColheitasDaPlanta {
  constructor(
    private readonly colheitas: Pick<RepositorioDeColheitas, 'listarPorPlanta'>,
    private readonly relogio: Relogio,
  ) {}

  async executar(idPlanta: string, dias = DIAS_DO_INDICADOR_DE_RENDIMENTO): Promise<ColheitasDaPlanta> {
    const registros = [...(await this.colheitas.listarPorPlanta(idPlanta))].sort(
      (a, b) => b.colhidaEm.getTime() - a.colhidaEm.getTime(),
    );
    const periodo = periodoDosUltimosDias(this.relogio.agora(), dias);
    return { registros, periodo, rendimento: calcularRendimentoPorUnidade(registros, periodo) };
  }
}

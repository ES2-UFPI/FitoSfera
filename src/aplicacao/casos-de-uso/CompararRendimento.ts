import { Planta } from '@/dominio/modelos/Planta';
import { UnidadeDeColheita } from '@/dominio/modelos/RegistroDeColheita';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeColheitas } from '@/dominio/portas/RepositorioDeColheitas';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';
import {
  calcularRendimento,
  PeriodoDeRendimento,
  periodoDosUltimosDias,
  Rendimento,
} from '@/dominio/regras/RendimentoDaColheita';

export const MINIMO_DE_PLANTAS_PARA_COMPARAR = 2;

export class PoucasPlantasParaComparar extends Error {
  constructor() {
    super(`Escolha pelo menos ${MINIMO_DE_PLANTAS_PARA_COMPARAR} plantas para comparar.`);
    this.name = 'PoucasPlantasParaComparar';
  }
}

export interface PedidoDeComparacao {
  readonly idsDasPlantas: readonly string[];
  /** Os últimos N dias até agora, como em `periodoDosUltimosDias`. */
  readonly dias: number;
  readonly unidade: UnidadeDeColheita;
}

export interface RendimentoDaPlanta {
  readonly planta: Planta;
  readonly rendimento: Rendimento;
}

export interface ComparacaoDeRendimento {
  readonly periodo: PeriodoDeRendimento;
  /** Do maior para o menor total; empate vai para quem colheu mais vezes e, depois, pela ordem do apelido. */
  readonly plantas: readonly RendimentoDaPlanta[];
}

/**
 * O rendimento de várias plantas no mesmo período e na mesma unidade, para a pessoa ver quais produzem melhor.
 * Planta sem colheitas no período entra com zero; id que não está mais no jardim fica de fora.
 */
export class CompararRendimento {
  constructor(
    private readonly plantas: Pick<RepositorioDePlantas, 'obterPorId'>,
    private readonly colheitas: Pick<RepositorioDeColheitas, 'listarPorPlanta'>,
    private readonly relogio: Relogio,
  ) {}

  async executar({ idsDasPlantas, dias, unidade }: PedidoDeComparacao): Promise<ComparacaoDeRendimento> {
    const ids = [...new Set(idsDasPlantas)];
    if (ids.length < MINIMO_DE_PLANTAS_PARA_COMPARAR) throw new PoucasPlantasParaComparar();
    const periodo = periodoDosUltimosDias(this.relogio.agora(), dias);

    const encontradas = await Promise.all(
      ids.map(async (id): Promise<RendimentoDaPlanta | null> => {
        const planta = await this.plantas.obterPorId(id);
        if (planta === null) return null;
        const registros = await this.colheitas.listarPorPlanta(id);
        return { planta, rendimento: calcularRendimento(registros, periodo, unidade) };
      }),
    );

    const plantas = encontradas
      .filter((item): item is RendimentoDaPlanta => item !== null)
      .sort(
        (a, b) =>
          b.rendimento.quantidadeTotal - a.rendimento.quantidadeTotal ||
          b.rendimento.numeroDeColheitas - a.rendimento.numeroDeColheitas ||
          a.planta.apelido.localeCompare(b.planta.apelido, 'pt-BR'),
      );
    return { periodo, plantas };
  }
}

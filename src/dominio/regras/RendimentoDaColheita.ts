import { RegistroDeColheita, UnidadeDeColheita, UNIDADES_DE_COLHEITA } from '../modelos/RegistroDeColheita';

/** Um intervalo de tempo com os dois limites inclusos: uma colheita exatamente no início ou no fim conta. */
export interface PeriodoDeRendimento {
  readonly inicio: Date;
  readonly fim: Date;
}

/** Quanto a planta produziu numa unidade, num período: o total colhido e em quantas colheitas. */
export interface Rendimento {
  readonly unidade: UnidadeDeColheita;
  readonly quantidadeTotal: number;
  readonly numeroDeColheitas: number;
}

/** Três casas bastam para gramas e apagam o resto de ponto flutuante, como 0,1 + 0,2 = 0,30000000000000004. */
const CASAS_DO_TOTAL = 3;

function arredondar(valor: number): number {
  const fator = 10 ** CASAS_DO_TOTAL;
  return Math.round(valor * fator) / fator;
}

function dentroDoPeriodo(instante: Date, { inicio, fim }: PeriodoDeRendimento): boolean {
  const momento = instante.getTime();
  return momento >= inicio.getTime() && momento <= fim.getTime();
}

/**
 * O rendimento de uma unidade no período. Só soma registros dessa unidade: frutos contados e gramas pesadas não se
 * misturam. Sem colheitas no período (ou com o início depois do fim), o rendimento é zero, nunca um erro.
 */
export function calcularRendimento(
  registros: readonly RegistroDeColheita[],
  periodo: PeriodoDeRendimento,
  unidade: UnidadeDeColheita,
): Rendimento {
  const contadas = registros.filter(
    (registro) => registro.unidade === unidade && dentroDoPeriodo(registro.colhidaEm, periodo),
  );
  return {
    unidade,
    quantidadeTotal: arredondar(contadas.reduce((total, registro) => total + registro.quantidade, 0)),
    numeroDeColheitas: contadas.length,
  };
}

/** O rendimento do período em cada unidade, na ordem de `UNIDADES_DE_COLHEITA`; unidade sem colheitas vem zerada. */
export function calcularRendimentoPorUnidade(
  registros: readonly RegistroDeColheita[],
  periodo: PeriodoDeRendimento,
): Record<UnidadeDeColheita, Rendimento> {
  return Object.fromEntries(
    UNIDADES_DE_COLHEITA.map((unidade) => [unidade, calcularRendimento(registros, periodo, unidade)]),
  ) as Record<UnidadeDeColheita, Rendimento>;
}

import { FaixaRecomendada } from '../modelos/FaixaRecomendada';
import { compararMedicaoComFaixa, SituacaoDaMedicao } from './AvaliacaoDaLeitura';
import { PeriodoDeLuz } from './LuzRecebida';

/**
 * Quanto de luz útil para a planta (µmol/m²/s) cada lux representa, no caso da luz do sol. O catálogo mede a meta
 * em DLI (mol/m²/dia), e o sensor mede em lux: a conversão é uma aproximação, que erra mais com LED ou lâmpada.
 */
export const UMOL_POR_SEGUNDO_POR_LUX = 0.0185;

/** O sensor publica a cada 5 min; sem contato por mais que isto, a luz depois do último contato é desconhecida. */
export const TOLERANCIA_SEM_CONTATO_MS = 20 * 60_000;

/** Um período sem contato que atravessa a meia-noite e cobre mais horas de sol que isto não dá para dividir. */
export const HORAS_DE_SOL_PARA_DIVIDIR = 3;

const NASCER_DO_SOL = 6;
const POR_DO_SOL = 18;
/** Antes de passar esta fração da luz do dia, a projeção seria quase um chute. */
const FRACAO_MINIMA_PARA_PROJETAR = 0.1;
const HORA_MS = 3_600_000;

export interface LuzDoDia {
  /** Luz recebida desde a meia-noite, em mol/m². */
  readonly dli: number;
  /** Até quando a luz do dia é conhecida: o último contato com o sensor. */
  readonly conhecidaAte: Date | null;
  /** Falta parte da luz do dia: o total não deve ser lido como falta de luz. */
  readonly incompleta: boolean;
  /** A luz do dia em relação ao mínimo da meta: 0,7 é "70% da luz de hoje". */
  readonly progresso: number | null;
  /** Estimativa da luz do dia inteiro, pelo ritmo típico do sol. */
  readonly projecaoDli: number | null;
  readonly situacaoProjetada: SituacaoDaMedicao | null;
}

export function luxMinutosParaDli(luxMinutos: number): number {
  return (luxMinutos * 60 * UMOL_POR_SEGUNDO_POR_LUX) / 1_000_000;
}

/**
 * A luz do dia de `agora`, contado da meia-noite local, a partir dos períodos registrados pelo sensor. Um período
 * que atravessa a meia-noite é dividido entre os dias na proporção do tempo, a menos que cubra muitas horas de sol:
 * aí não dá para saber em que dia a luz caiu, e os dias que ele toca ficam incompletos.
 */
export function calcularLuzDoDia({
  periodos,
  conhecidaAte,
  meta,
  agora,
}: {
  periodos: readonly PeriodoDeLuz[];
  conhecidaAte: Date | null;
  meta: FaixaRecomendada | null;
  agora: Date;
}): LuzDoDia {
  const inicioDoDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const fimDoDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);

  let luxMinutos = 0;
  let incompleta = conhecidaAte === null || agora.getTime() - conhecidaAte.getTime() > TOLERANCIA_SEM_CONTATO_MS;
  for (const periodo of periodos) {
    const fracao = fracaoNoDia(periodo, inicioDoDia, fimDoDia);
    if (fracao === 0) continue;
    luxMinutos += periodo.luxMinutos * fracao;
    if (periodo.incompleta || (fracao < 1 && horasDeSol(periodo.inicio, periodo.fim) > HORAS_DE_SOL_PARA_DIVIDIR))
      incompleta = true;
  }

  const dli = luxMinutosParaDli(luxMinutos);
  const projecaoDli = projetar(dli, conhecidaAte, inicioDoDia);
  return {
    dli,
    conhecidaAte,
    incompleta,
    progresso: meta === null || meta.minimo <= 0 ? null : dli / meta.minimo,
    projecaoDli,
    situacaoProjetada: meta === null || projecaoDli === null ? null : compararMedicaoComFaixa(projecaoDli, meta),
  };
}

/** A parte do período que caiu no dia, pelo tempo. */
function fracaoNoDia(periodo: PeriodoDeLuz, inicioDoDia: Date, fimDoDia: Date): number {
  const inicio = periodo.inicio.getTime();
  const fim = periodo.fim.getTime();
  if (fim <= inicio) return inicio >= inicioDoDia.getTime() && inicio < fimDoDia.getTime() ? 1 : 0;
  const sobreposicao = Math.min(fim, fimDoDia.getTime()) - Math.max(inicio, inicioDoDia.getTime());
  return Math.max(0, sobreposicao) / (fim - inicio);
}

/** Quantas horas do período caem entre o nascer e o pôr do sol, somando todos os dias que ele atravessa. */
function horasDeSol(inicio: Date, fim: Date): number {
  let total = 0;
  const dia = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  while (dia.getTime() < fim.getTime()) {
    const nascer = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), NASCER_DO_SOL).getTime();
    const por = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), POR_DO_SOL).getTime();
    total += Math.max(0, Math.min(fim.getTime(), por) - Math.max(inicio.getTime(), nascer));
    dia.setDate(dia.getDate() + 1);
  }
  return total / HORA_MS;
}

/**
 * A luz de um dia de sol segue mais ou menos uma curva: pouca de manhã cedo, mais ao meio-dia, pouca no fim da
 * tarde. Esta é a fração dessa curva que já passou até `instante`, entre as 6h e as 18h.
 */
function fracaoDaLuzDoDia(instante: Date): number {
  const horas = instante.getHours() + instante.getMinutes() / 60;
  if (horas <= NASCER_DO_SOL) return 0;
  if (horas >= POR_DO_SOL) return 1;
  return (1 - Math.cos((Math.PI * (horas - NASCER_DO_SOL)) / (POR_DO_SOL - NASCER_DO_SOL))) / 2;
}

function projetar(dli: number, conhecidaAte: Date | null, inicioDoDia: Date): number | null {
  if (conhecidaAte === null || conhecidaAte.getTime() < inicioDoDia.getTime()) return null;
  const fracao = fracaoDaLuzDoDia(conhecidaAte);
  return fracao < FRACAO_MINIMA_PARA_PROJETAR ? null : dli / fracao;
}

import { diasDeCalendarioEntre } from './TempoNoJardim';

/** O que a regra precisa saber para datar a próxima rega de uma planta. */
export interface DadosDaRega {
  /** A rega mais recente, ou null quando a planta nunca foi regada. */
  readonly ultimaRegaEm: Date | null;
  /** Referência de quem nunca foi regada; null em planta antiga, gravada sem data de cadastro. */
  readonly cadastradaEm: Date | null;
  /** Intervalo de rega da espécie, em dias; null quando não se sabe qual é. */
  readonly intervaloEmDias: number | null;
  readonly agora: Date;
}

export interface SituacaoDaRega {
  /** Quando regar de novo; null quando falta o intervalo ou falta a referência. */
  readonly proximaEm: Date | null;
  /** Dias até a próxima rega: 0 no dia do prazo, negativo quando ele já passou. Null junto com `proximaEm`. */
  readonly diasAteAProxima: number | null;
  /** True só a partir do dia do prazo. Enquanto a rega é recente, o lembrete fica suprimido. */
  readonly precisaRegar: boolean;
}

/**
 * A referência de onde o intervalo é contado: a última rega, e a data de cadastro enquanto a planta nunca foi
 * regada. É isto que faz registrar uma rega adiar o lembrete — a conta recomeça dela.
 */
export function referenciaDaRega(ultimaRegaEm: Date | null, cadastradaEm: Date | null): Date | null {
  return ultimaRegaEm ?? cadastradaEm;
}

/**
 * Quando é a próxima rega e se o lembrete já pode cobrar. Sem intervalo ou sem referência, a regra não inventa
 * prazo e `precisaRegar` fica false: é melhor não cobrar do que cobrar uma rega que talvez não seja devida.
 */
export function situacaoDaRega({ ultimaRegaEm, cadastradaEm, intervaloEmDias, agora }: DadosDaRega): SituacaoDaRega {
  const referencia = referenciaDaRega(ultimaRegaEm, cadastradaEm);
  if (referencia === null || intervaloEmDias === null || !Number.isFinite(intervaloEmDias) || intervaloEmDias <= 0)
    return { proximaEm: null, diasAteAProxima: null, precisaRegar: false };

  const proximaEm = somarDias(referencia, intervaloEmDias);
  const diasAteAProxima = diasDeCalendarioEntre(agora, proximaEm);
  return { proximaEm, diasAteAProxima, precisaRegar: diasAteAProxima <= 0 };
}

/** Soma dias mantendo a hora do dia: pelo calendário local, a troca de horário de verão não desloca o prazo. */
function somarDias(instante: Date, dias: number): Date {
  const data = new Date(instante);
  data.setDate(data.getDate() + dias);
  return data;
}

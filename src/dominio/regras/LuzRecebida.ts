/** O contador do firmware é um uint32: ao estourar, recomeça do zero. */
const VOLTA_DO_CONTADOR = 2 ** 32;

/** O último valor do contador de luz já contabilizado, e de qual ligação do sensor ele veio. */
export interface MarcaDoContadorDeLuz {
  readonly idReinicio: number;
  readonly luzAcumuladaLuxMinutos: number;
  readonly medidaEm: Date;
}

/** A luz que o sensor somou entre dois contatos com o app. */
export interface PeriodoDeLuz {
  readonly luxMinutos: number;
  readonly inicio: Date;
  readonly fim: Date;
  /** O sensor reiniciou no período: a luz medida antes do reinício se perdeu. */
  readonly incompleta: boolean;
}

export interface ResultadoDaLuzRecebida {
  readonly marca: MarcaDoContadorDeLuz;
  readonly recebida: PeriodoDeLuz | null;
}

/**
 * Compara o contador recebido com o último contabilizado. Sem marca, ou com um id de reinício diferente, o valor
 * não diz nada sobre o período: pode ser um sensor recém-associado, ligado há semanas. Por isso esses casos não
 * contam luz, e o valor recebido só vira o novo ponto de partida.
 */
export function calcularLuzRecebida(
  marca: MarcaDoContadorDeLuz | null,
  atual: MarcaDoContadorDeLuz,
): ResultadoDaLuzRecebida {
  if (marca === null) return { marca: atual, recebida: null };

  const periodo = { inicio: marca.medidaEm, fim: atual.medidaEm };
  if (marca.idReinicio !== atual.idReinicio)
    return { marca: atual, recebida: { ...periodo, luxMinutos: 0, incompleta: true } };

  const diferenca = atual.luzAcumuladaLuxMinutos - marca.luzAcumuladaLuxMinutos;
  // Uma queda pequena é um pacote atrasado (a leitura da característica pode chegar depois da notificação);
  // só uma queda de mais da metade da faixa é o contador dando a volta.
  if (diferenca < 0 && -diferenca <= VOLTA_DO_CONTADOR / 2) return { marca, recebida: null };

  const luxMinutos = diferenca < 0 ? diferenca + VOLTA_DO_CONTADOR : diferenca;
  return { marca: atual, recebida: luxMinutos === 0 ? null : { ...periodo, luxMinutos, incompleta: false } };
}

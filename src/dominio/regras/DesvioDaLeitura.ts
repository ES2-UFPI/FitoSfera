import { FaixaRecomendada, FaixasRecomendadas } from '../modelos/FaixaRecomendada';
import { Leitura } from '../modelos/Leitura';
import { compararMedicaoComFaixa, SituacaoDaMedicao } from './AvaliacaoDaLeitura';
import { ehNoite } from './PeriodoDoDia';

/** As grandezas que o sensor mede, na ordem em que aparecem para a pessoa. */
export const GRANDEZAS = ['umidadeDoAr', 'temperatura', 'luminosidade'] as const;
export type Grandeza = (typeof GRANDEZAS)[number];

/** Só dá para desviar para fora da faixa: `ideal` não é desvio. */
export type SentidoDoDesvio = Exclude<SituacaoDaMedicao, 'ideal'>;

/** Uma grandeza que saiu da faixa recomendada da planta, com o valor medido e a faixa que ele furou. */
export interface Desvio {
  readonly grandeza: Grandeza;
  readonly sentido: SentidoDoDesvio;
  readonly valor: number;
  readonly faixa: FaixaRecomendada;
}

const MEDICAO_DA_GRANDEZA: Record<Grandeza, (leitura: Leitura) => number | null> = {
  umidadeDoAr: (leitura) => leitura.umidadePercentual,
  temperatura: (leitura) => leitura.temperaturaCelsius,
  luminosidade: (leitura) => leitura.luminosidadeLux,
};

/** Quanto tempo um desvio precisa durar para virar aviso: menos que isso é oscilação, como uma nuvem passando. */
export const TEMPO_MINIMO_DO_DESVIO_MS = 30 * 60_000;

/**
 * As faixas que valem na hora da leitura. À noite, temperatura e umidade usam as faixas da noite (ou as do dia, se a
 * planta não tiver as da noite), e a luminosidade não tem faixa: escuro à noite é o normal, não um desvio.
 */
function faixasDoPeriodo(faixas: FaixasRecomendadas, instante: Date): Partial<Record<Grandeza, FaixaRecomendada>> {
  if (!ehNoite(instante)) return faixas;
  return {
    umidadeDoAr: faixas.umidadeDoArNoturna ?? faixas.umidadeDoAr,
    temperatura: faixas.temperaturaNoturna ?? faixas.temperatura,
  };
}

/**
 * Os desvios de uma leitura, na ordem de `GRANDEZAS`, pelas faixas do período em que ela foi medida (dia ou noite).
 * Usa a mesma comparação do painel (`compararMedicaoComFaixa`), então um valor exatamente no limite está dentro e
 * não vira desvio.
 */
export function detectarDesvios(leitura: Leitura, faixas: FaixasRecomendadas): readonly Desvio[] {
  const doPeriodo = faixasDoPeriodo(faixas, leitura.medidaEm);
  return GRANDEZAS.flatMap((grandeza) => {
    const valor = MEDICAO_DA_GRANDEZA[grandeza](leitura);
    const faixa = doPeriodo[grandeza];
    if (valor === null || faixa === undefined) return [];
    const situacao = compararMedicaoComFaixa(valor, faixa);
    return situacao === 'ideal' ? [] : [{ grandeza, sentido: situacao, valor, faixa }];
  });
}

/**
 * A identidade de um desvio, para o mesmo problema ainda não resolvido não notificar de novo. Depende só de
 * quais grandezas desviaram e para que lado: a umidade cair de 39% para 31% continua sendo o mesmo desvio,
 * mas a temperatura também sair da faixa é um desvio novo. Leitura dentro da faixa tem assinatura vazia.
 */
export function assinaturaDosDesvios(desvios: readonly Desvio[]): string {
  return desvios.map(chaveDoDesvio).join('|');
}

/** A identidade de um único desvio, por grandeza e sentido, como ele entra na assinatura. */
export function chaveDoDesvio(desvio: Desvio): string {
  return `${desvio.grandeza}:${desvio.sentido}`;
}

export interface DesviosAcompanhados {
  /** Desde quando cada desvio da leitura vem sendo visto, por `chaveDoDesvio`: é o que a próxima verificação recebe. */
  readonly vistosDesde: ReadonlyMap<string, Date>;
  /** Os desvios que já duram o tempo mínimo, na ordem de `GRANDEZAS`: só estes viram aviso. */
  readonly confirmados: readonly Desvio[];
}

/**
 * Separa os desvios que já duram o bastante para avisar. Cada desvio é contado desde a primeira leitura em que
 * apareceu; o que voltou para a faixa sai da conta, e se desviar de novo recomeça do zero. A medida é a hora da
 * leitura, e não a da verificação, porque o sensor pode ter medido um tempo antes.
 */
export function acompanharDesvios(
  desvios: readonly Desvio[],
  vistosAntes: ReadonlyMap<string, Date>,
  medidaEm: Date,
  tempoMinimoMs: number = TEMPO_MINIMO_DO_DESVIO_MS,
): DesviosAcompanhados {
  const vistosDesde = new Map<string, Date>();
  const confirmados = desvios.filter((desvio) => {
    const chave = chaveDoDesvio(desvio);
    const desde = vistosAntes.get(chave) ?? medidaEm;
    vistosDesde.set(chave, desde);
    return medidaEm.getTime() - desde.getTime() >= tempoMinimoMs;
  });
  return { vistosDesde, confirmados };
}

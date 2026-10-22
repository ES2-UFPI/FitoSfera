import { FaixaRecomendada, FaixasRecomendadas } from '../modelos/FaixaRecomendada';
import { Leitura } from '../modelos/Leitura';
import { compararMedicaoComFaixa, SituacaoDaMedicao } from './AvaliacaoDaLeitura';

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

/**
 * Os desvios de uma leitura, na ordem de `GRANDEZAS`. Usa a mesma comparação do painel
 * (`compararMedicaoComFaixa`), então um valor exatamente no limite está dentro e não vira desvio.
 */
export function detectarDesvios(leitura: Leitura, faixas: FaixasRecomendadas): readonly Desvio[] {
  return GRANDEZAS.flatMap((grandeza) => {
    const valor = MEDICAO_DA_GRANDEZA[grandeza](leitura);
    if (valor === null) return [];
    const faixa = faixas[grandeza];
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
  return desvios.map((desvio) => `${desvio.grandeza}:${desvio.sentido}`).join('|');
}

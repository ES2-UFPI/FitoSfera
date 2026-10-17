import { FaixaIdeal, FaixasIdeais } from '../modelos/EspecieVegetal';
import { LeituraAmbiental } from '../modelos/LeituraAmbiental';

/** O resumo que a estante mostra: está tudo bem, precisa de atenção, ou não dá para saber. */
export type StatusDaPlanta = 'ok' | 'atencao' | 'sem-dados';

/** Uma leitura mais velha que isto não diz nada sobre agora. */
export const VALIDADE_DA_LEITURA_MS = 30 * 60_000;

/** Intervalo fechado: os dois limites contam como dentro. */
export function estaNaFaixa(valor: number, faixa: Pick<FaixaIdeal, 'minimo' | 'maximo'>): boolean {
  return valor >= faixa.minimo && valor <= faixa.maximo;
}

/**
 * Compara a última leitura com a faixa recomendada da espécie. Sem leitura recente, ou sem faixa,
 * a resposta é "sem-dados" — nunca "ok", para não tranquilizar a pessoa sem motivo.
 */
export function avaliarStatus(entrada: {
  leitura: LeituraAmbiental | null;
  faixas: FaixasIdeais | null;
  agora: Date;
}): StatusDaPlanta {
  const { leitura, faixas, agora } = entrada;
  if (leitura === null || faixas === null) return 'sem-dados';
  if (agora.getTime() - leitura.medidaEm.getTime() > VALIDADE_DA_LEITURA_MS) return 'sem-dados';

  const tudoNaFaixa =
    estaNaFaixa(leitura.umidadePercentual, faixas.umidadeDoAr) &&
    estaNaFaixa(leitura.temperaturaCelsius, faixas.temperatura) &&
    estaNaFaixa(leitura.luminosidadeLux, faixas.luminosidade);
  return tudoNaFaixa ? 'ok' : 'atencao';
}

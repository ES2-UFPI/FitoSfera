import { FaixaRecomendada, FaixasRecomendadas } from '../modelos/FaixaRecomendada';
import { LeituraAmbiental } from '../modelos/LeituraAmbiental';

/** O resumo que a estante mostra: está tudo bem, precisa de atenção, ou não dá para saber. */
export type StatusDaPlanta = 'ok' | 'atencao' | 'sem-dados';

/** Uma leitura mais velha que isto não diz nada sobre agora. */
export const VALIDADE_DA_LEITURA_MS = 30 * 60_000;

/** Exatamente no limite ainda vale; só fica desatualizada depois dele. */
export function leituraEstaDesatualizada(leitura: Pick<LeituraAmbiental, 'medidaEm'>, agora: Date): boolean {
  return agora.getTime() - leitura.medidaEm.getTime() > VALIDADE_DA_LEITURA_MS;
}

/** Intervalo fechado: os dois limites contam como dentro. */
export function estaNaFaixa(valor: number, faixa: FaixaRecomendada): boolean {
  return valor >= faixa.minimo && valor <= faixa.maximo;
}

/**
 * Compara a última leitura com as faixas recomendadas guardadas na planta. Sem leitura recente, ou sem faixa,
 * a resposta é "sem-dados" — nunca "ok", para não tranquilizar a pessoa sem motivo.
 */
export function avaliarStatus(entrada: {
  leitura: LeituraAmbiental | null;
  faixas: FaixasRecomendadas | null;
  agora: Date;
}): StatusDaPlanta {
  const { leitura, faixas, agora } = entrada;
  if (leitura === null || faixas === null) return 'sem-dados';
  if (leituraEstaDesatualizada(leitura, agora)) return 'sem-dados';

  const tudoNaFaixa =
    estaNaFaixa(leitura.umidadePercentual, faixas.umidadeDoAr) &&
    estaNaFaixa(leitura.temperaturaCelsius, faixas.temperatura) &&
    estaNaFaixa(leitura.luminosidadeLux, faixas.luminosidade);
  return tudoNaFaixa ? 'ok' : 'atencao';
}

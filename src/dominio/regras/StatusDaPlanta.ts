import { FaixasRecomendadas } from '../modelos/FaixaRecomendada';
import { LeituraAmbiental } from '../modelos/LeituraAmbiental';
import {
  compararLeituraComFaixas,
  SituacoesDaLeitura,
  todasAsMedicoesEstaoIdeais,
} from './AvaliacaoDaLeitura';

/** O resumo que a estante mostra: está tudo bem, precisa de atenção, ou não dá para saber. */
export type StatusDaPlanta = 'ok' | 'atencao' | 'sem-dados';

/** Uma leitura mais velha que isto não diz nada sobre agora. */
export const VALIDADE_DA_LEITURA_MS = 30 * 60_000;

/** Exatamente no limite ainda vale; só fica desatualizada depois dele. */
export function leituraEstaDesatualizada(leitura: Pick<LeituraAmbiental, 'medidaEm'>, agora: Date): boolean {
  return agora.getTime() - leitura.medidaEm.getTime() > VALIDADE_DA_LEITURA_MS;
}

export interface AvaliacaoDasCondicoes {
  readonly status: StatusDaPlanta;
  readonly situacoes: SituacoesDaLeitura | null;
  readonly leituraDesatualizada: boolean;
}

/**
 * Compara a última leitura com as faixas recomendadas guardadas na planta. Sem leitura recente, ou sem faixa,
 * a resposta é "sem-dados" — nunca "ok", para não tranquilizar a pessoa sem motivo.
 */
export function avaliarCondicoes(entrada: {
  leitura: LeituraAmbiental | null;
  faixas: FaixasRecomendadas | null;
  agora: Date;
}): AvaliacaoDasCondicoes {
  const { leitura, faixas, agora } = entrada;
  const leituraDesatualizada = leitura !== null && leituraEstaDesatualizada(leitura, agora);
  if (leitura === null || faixas === null || leituraDesatualizada) {
    return { status: 'sem-dados', situacoes: null, leituraDesatualizada };
  }

  const situacoes = compararLeituraComFaixas(leitura, faixas);
  const status = todasAsMedicoesEstaoIdeais(situacoes) ? 'ok' : 'atencao';
  return { status, situacoes, leituraDesatualizada: false };
}

/** Compatibilidade para quem precisa apenas do resumo usado na estante. */
export function avaliarStatus(entrada: Parameters<typeof avaliarCondicoes>[0]): StatusDaPlanta {
  return avaliarCondicoes(entrada).status;
}

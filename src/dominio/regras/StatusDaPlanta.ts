import { FaixasRecomendadas } from '../modelos/FaixaRecomendada';
import { Leitura } from '../modelos/Leitura';
import { compararMedicaoComFaixa, SituacaoDaMedicao, SituacoesDaLeitura } from './AvaliacaoDaLeitura';
import { faixasDoPeriodo } from './PeriodoDoDia';

/** O resumo que a estante mostra: está tudo bem, precisa de atenção, ou não dá para saber. */
export type StatusDaPlanta = 'ok' | 'atencao' | 'sem-dados';

/** Uma leitura mais velha que isto não diz nada sobre agora. */
export const VALIDADE_DA_LEITURA_MS = 30 * 60_000;

/** Exatamente no limite ainda vale; só fica desatualizada depois dele. */
export function leituraEstaDesatualizada(leitura: Pick<Leitura, 'medidaEm'>, agora: Date): boolean {
  return agora.getTime() - leitura.medidaEm.getTime() > VALIDADE_DA_LEITURA_MS;
}

export interface AvaliacaoDasCondicoes {
  readonly status: StatusDaPlanta;
  readonly situacoes: SituacoesDaLeitura | null;
  readonly leituraDesatualizada: boolean;
}

/**
 * Compara a última leitura com as faixas recomendadas guardadas na planta, pelas faixas do período em que ela foi
 * medida: à noite valem as faixas da noite e a luz não conta (é a mesma regra dos avisos). Sem leitura recente, ou
 * sem faixa, a resposta é "sem-dados" — nunca "ok", para não tranquilizar a pessoa sem motivo.
 *
 * Luz abaixo do ideal não muda o status: o que a planta precisa é do total do dia, e dentro de casa uma espécie de
 * sol pleno ficaria em "atenção" o tempo todo. A falta de luz continua no painel e no cartão da luz de hoje. Luz
 * acima do ideal conta, porque sol direto demais queima a planta e dá para resolver na hora.
 */
export function avaliarCondicoes(entrada: {
  leitura: Leitura | null;
  faixas: FaixasRecomendadas | null;
  agora: Date;
}): AvaliacaoDasCondicoes {
  const { leitura, faixas, agora } = entrada;
  const leituraDesatualizada = leitura !== null && leituraEstaDesatualizada(leitura, agora);
  if (leitura === null || faixas === null || leituraDesatualizada) {
    return { status: 'sem-dados', situacoes: null, leituraDesatualizada };
  }

  const doPeriodo = faixasDoPeriodo(faixas, leitura.medidaEm);
  const situacoes: SituacoesDaLeitura = {
    umidadeDoAr: compararMedicaoComFaixa(leitura.umidadePercentual, doPeriodo.umidadeDoAr),
    temperatura: compararMedicaoComFaixa(leitura.temperaturaCelsius, doPeriodo.temperatura),
    luminosidade:
      leitura.luminosidadeLux === null || doPeriodo.luminosidade === null
        ? null
        : compararMedicaoComFaixa(leitura.luminosidadeLux, doPeriodo.luminosidade),
  };
  // Contam umidade e temperatura; a luz, só quando está acima do ideal (ver o comentário da função).
  const queContam: (SituacaoDaMedicao | null)[] = [situacoes.umidadeDoAr, situacoes.temperatura];
  if (luzContaParaOStatus(situacoes.luminosidade)) queContam.push(situacoes.luminosidade);
  const status = queContam.some((situacao) => situacao === 'abaixo' || situacao === 'acima')
    ? 'atencao'
    : queContam.every((situacao) => situacao === 'ideal')
      ? 'ok'
      : 'sem-dados';
  return { status, situacoes, leituraDesatualizada: false };
}

/** Compatibilidade para quem precisa apenas do resumo usado na estante. */
export function avaliarStatus(entrada: Parameters<typeof avaliarCondicoes>[0]): StatusDaPlanta {
  return avaliarCondicoes(entrada).status;
}

/** A luz só pesa quando sobra: falta de luz é assunto do total do dia, não da leitura de agora. */
export function luzContaParaOStatus(situacao: SituacaoDaMedicao | null): boolean {
  return situacao === 'acima';
}

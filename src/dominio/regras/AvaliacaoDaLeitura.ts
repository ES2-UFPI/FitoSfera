import { FaixaRecomendada, FaixasRecomendadas } from '../modelos/FaixaRecomendada';
import { Leitura } from '../modelos/Leitura';

/** Posição de uma medição em relação ao intervalo recomendado, que inclui os dois limites. */
export type SituacaoDaMedicao = 'abaixo' | 'ideal' | 'acima';

export interface SituacoesDaLeitura {
  readonly umidadeDoAr: SituacaoDaMedicao;
  readonly temperatura: SituacaoDaMedicao;
  readonly luminosidade: SituacaoDaMedicao;
}

/** Regra única para painel, resumo do jardim e futuras notificações. */
export function compararMedicaoComFaixa(valor: number, faixa: FaixaRecomendada): SituacaoDaMedicao {
  if (valor < faixa.minimo) return 'abaixo';
  if (valor > faixa.maximo) return 'acima';
  return 'ideal';
}

export function compararLeituraComFaixas(
  leitura: Leitura,
  faixas: FaixasRecomendadas,
): SituacoesDaLeitura {
  return {
    umidadeDoAr: compararMedicaoComFaixa(leitura.umidadePercentual, faixas.umidadeDoAr),
    temperatura: compararMedicaoComFaixa(leitura.temperaturaCelsius, faixas.temperatura),
    luminosidade: compararMedicaoComFaixa(leitura.luminosidadeLux, faixas.luminosidade),
  };
}

export function todasAsMedicoesEstaoIdeais(situacoes: SituacoesDaLeitura): boolean {
  return (
    situacoes.umidadeDoAr === 'ideal' &&
    situacoes.temperatura === 'ideal' &&
    situacoes.luminosidade === 'ideal'
  );
}

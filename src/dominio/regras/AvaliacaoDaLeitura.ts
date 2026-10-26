import { FaixaRecomendada, FaixasRecomendadas } from '../modelos/FaixaRecomendada';
import { Leitura } from '../modelos/Leitura';

/** Posição de uma medição em relação ao intervalo recomendado, que inclui os dois limites. */
export type SituacaoDaMedicao = 'abaixo' | 'ideal' | 'acima';

export interface SituacoesDaLeitura {
  readonly umidadeDoAr: SituacaoDaMedicao;
  readonly temperatura: SituacaoDaMedicao;
  /** Null quando a leitura veio sem luminosidade. */
  readonly luminosidade: SituacaoDaMedicao | null;
}

/** Regra única para painel, resumo do jardim e notificações de desvio. */
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
    luminosidade:
      leitura.luminosidadeLux === null ? null : compararMedicaoComFaixa(leitura.luminosidadeLux, faixas.luminosidade),
  };
}

export function algumaMedicaoForaDaFaixa(situacoes: SituacoesDaLeitura): boolean {
  return [situacoes.umidadeDoAr, situacoes.temperatura, situacoes.luminosidade].some(
    (situacao) => situacao === 'abaixo' || situacao === 'acima',
  );
}

export function todasAsMedicoesEstaoIdeais(situacoes: SituacoesDaLeitura): boolean {
  return (
    situacoes.umidadeDoAr === 'ideal' &&
    situacoes.temperatura === 'ideal' &&
    situacoes.luminosidade === 'ideal'
  );
}

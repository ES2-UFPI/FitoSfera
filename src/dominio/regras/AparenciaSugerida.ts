import { Aparencia, APARENCIA_INICIAL, IdDestaque, IdForma } from '../modelos/Aparencia';

/**
 * Formas e cores que lembram cada frutífera do catálogo. Sem isso, toda planta que dá frutos começava igual a um
 * tomate: morango, abobrinha e pimentão lado a lado na estante, idênticos. Espécie fora da lista usa o padrão.
 */
const SUGESTOES_DAS_FRUTIFERAS: Readonly<Record<string, { forma: IdForma; destaque: IdDestaque }>> = {
  morango: { forma: 'rasteira', destaque: 'vermelho' },
  abobrinha: { forma: 'rasteira', destaque: 'amarelo' },
  pimentao: { forma: 'frutifera', destaque: 'laranja' },
  limoeiro: { forma: 'frutifera', destaque: 'amarelo' },
};

const PADRAO_DAS_FRUTIFERAS = { forma: 'frutifera', destaque: 'vermelho' } as const;

/**
 * A aparência com que o cadastro começa, depois de a pessoa escolher a espécie. Só a forma e a cor dos frutos
 * mudam: a folhagem e o vaso continuam como estavam, e a pessoa pode trocar tudo no mesmo passo.
 */
export function sugerirAparencia(especie: { readonly id: string; readonly frutifera: boolean }, atual: Aparencia): Aparencia {
  if (!especie.frutifera) return { ...atual, forma: APARENCIA_INICIAL.forma };
  return { ...atual, ...(SUGESTOES_DAS_FRUTIFERAS[especie.id] ?? PADRAO_DAS_FRUTIFERAS) };
}

/**
 * Como a planta é desenhada: uma forma, um tom de folhagem, uma cor de destaque e um vaso.
 * O domínio só conhece os identificadores; as cores e os traços ficam na apresentação.
 * Todas as escolhas valem para qualquer espécie.
 */
export const FORMAS = ['frutifera', 'erva', 'flor', 'espiga', 'rasteira', 'pendente', 'ereta', 'suculenta'] as const;
export const FOLHAGENS = [
  'verde-folha',
  'verde-escuro',
  'menta',
  'salvia',
  'limao',
  'azulado',
  'oliva',
  'roxo',
] as const;
export const DESTAQUES = ['vermelho', 'laranja', 'amarelo', 'rosa', 'lilas', 'roxo', 'azul', 'vinho', 'creme'] as const;
export const VASOS = ['terracota', 'creme', 'azul', 'salvia', 'grafite', 'mostarda'] as const;

export type IdForma = (typeof FORMAS)[number];
export type IdFolhagem = (typeof FOLHAGENS)[number];
export type IdDestaque = (typeof DESTAQUES)[number];
export type IdVaso = (typeof VASOS)[number];

export interface Aparencia {
  readonly forma: IdForma;
  readonly folhagem: IdFolhagem;
  readonly destaque: IdDestaque;
  readonly vaso: IdVaso;
}

/** Ponto de partida de toda planta nova, seja qual for a espécie. */
export const APARENCIA_INICIAL: Aparencia = {
  forma: 'erva',
  folhagem: 'verde-folha',
  destaque: 'vermelho',
  vaso: 'terracota',
};

function escolher<T extends string>(opcoes: readonly T[], valor: unknown, padrao: T): T {
  return opcoes.includes(valor as T) ? (valor as T) : padrao;
}

/**
 * Lê uma aparência vinda de fora (armazenamento, versão antiga do app) sem confiar nela:
 * cada campo desconhecido volta para o valor da aparência inicial.
 */
export function normalizarAparencia(bruta: unknown): Aparencia {
  const campos = typeof bruta === 'object' && bruta !== null ? (bruta as Record<string, unknown>) : {};
  return {
    forma: escolher(FORMAS, campos.forma, APARENCIA_INICIAL.forma),
    folhagem: escolher(FOLHAGENS, campos.folhagem, APARENCIA_INICIAL.folhagem),
    destaque: escolher(DESTAQUES, campos.destaque, APARENCIA_INICIAL.destaque),
    vaso: escolher(VASOS, campos.vaso, APARENCIA_INICIAL.vaso),
  };
}

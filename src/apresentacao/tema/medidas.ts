/** Escala de espaçamento e raios, para as telas não inventarem números soltos. */
export const ESPACO = {
  minimo: 4,
  pequeno: 8,
  medio: 12,
  grande: 16,
  amplo: 20,
  folgado: 24,
} as const;

export const RAIO = {
  pequeno: 6,
  medio: 14,
  grande: 22,
  pilula: 999,
} as const;

/** Altura mínima de qualquer coisa tocável. */
export const ALVO_DE_TOQUE = 48;

export const ALTURA_DA_BARRA_DE_ABAS = 58;

/** Estante: cada prateleira tem altura fixa, para dar para contar quantas cabem na tela. */
export const LARGURA_DO_VASO = 76;
/** O desenho da planta com o vaso tem 1,7 vez a largura. */
export const ALTURA_DA_AREA_DOS_VASOS = Math.ceil(LARGURA_DO_VASO * 1.7);
export const ALTURA_DA_MADEIRA = 13;
export const ALTURA_DA_BORDA_DA_MADEIRA = 5;
export const ALTURA_DA_TABUA = ALTURA_DA_MADEIRA + ALTURA_DA_BORDA_DA_MADEIRA;
export const ALTURA_DA_ETIQUETA = 34;
export const ESPACO_ENTRE_PRATELEIRAS = 12;
export const ALTURA_DA_PRATELEIRA =
  ALTURA_DA_AREA_DOS_VASOS + ALTURA_DA_TABUA + ALTURA_DA_ETIQUETA + ESPACO_ENTRE_PRATELEIRAS;

/** Espaço livre no fim da estante para o botão "Nova planta" não cobrir nenhum vaso. */
export const FOLGA_DO_BOTAO_FLUTUANTE = 76;

/**
 * Escala de espaçamento e raios, para as telas não inventarem números soltos. `fino` e `curto` são os ajustes
 * finos (entre linhas de um mesmo bloco, dentro de etiquetas); o resto separa blocos.
 */
export const ESPACO = {
  fino: 2,
  minimo: 4,
  curto: 6,
  pequeno: 8,
  medio: 12,
  grande: 16,
  amplo: 20,
  folgado: 24,
} as const;

export const RAIO = {
  fino: 4,
  pequeno: 6,
  medio: 14,
  grande: 22,
  pilula: 999,
} as const;

/** Até onde um cartão ou o conteúdo de uma tela cresce: num tablet, a leitura não vira uma linha comprida. */
export const LARGURA_DO_CONTEUDO = 520;

/** Um modal é mais estreito que o conteúdo: a caixa fica no meio da tela, com a tela de baixo aparecendo em volta. */
export const LARGURA_DO_MODAL = 440;

/** Uma frase centralizada não passa disto, para ler sem virar a cabeça. */
export const LARGURA_DA_LEITURA = 300;

/** Altura mínima de qualquer coisa tocável. */
export const ALVO_DE_TOQUE = 48;

/**
 * O menor alvo aceito (44 × 44 pontos, o mínimo das diretrizes do iOS e da US07), para ícones e amostras que
 * não cabem em `ALVO_DE_TOQUE`. Nada tocável fica abaixo disto, nem contando só a parte visível.
 */
export const ALVO_DE_TOQUE_MINIMO = 44;

export const ALTURA_DA_BARRA_DE_ABAS = 58;

/** Estante: cada prateleira tem altura fixa, para dar para contar quantas cabem na tela. */
export const LARGURA_DO_VASO = 76;
/** O desenho da planta com o vaso tem 1,7 vez a largura. */
export const ALTURA_DA_AREA_DOS_VASOS = Math.ceil(LARGURA_DO_VASO * 1.7);
export const ALTURA_DA_MADEIRA = 13;
export const ALTURA_DA_BORDA_DA_MADEIRA = 5;
export const ALTURA_DA_TABUA = ALTURA_DA_MADEIRA + ALTURA_DA_BORDA_DA_MADEIRA;
/** Fio + papel com o apelido e a linha do status. */
export const ALTURA_DA_ETIQUETA = 50;
export const ESPACO_ENTRE_PRATELEIRAS = 12;
export const ALTURA_DA_PRATELEIRA =
  ALTURA_DA_AREA_DOS_VASOS + ALTURA_DA_TABUA + ALTURA_DA_ETIQUETA + ESPACO_ENTRE_PRATELEIRAS;

/** Espaço livre no fim da estante para o botão "Nova planta" não cobrir nenhum vaso. */
export const FOLGA_DO_BOTAO_FLUTUANTE = 76;

/**
 * Paleta da "Estante ao sol": madeira, papel kraft e luz de janela.
 * As cores dos desenhos das plantas ficam em `ilustracao/paletas.ts`.
 */
export const CORES = {
  fundoTopo: '#FCF5EA',
  fundoBase: '#F4E6D2',
  luzDaJanela: '#FFE1A0',
  luzDoSol: '#E2A13B',

  texto: '#3D3326',
  textoApoio: '#7A6550',
  rotulo: '#80603C',

  madeiraTopo: '#C99366',
  madeiraBase: '#B07B4E',
  madeiraBorda: '#8B5D37',
  sombraDaMadeira: '#5A3719',

  papel: '#F1DDBD',
  textoDoPapel: '#5B4632',
  tracejado: '#C9A77E',
  bolinhaDePasso: '#EAD9BF',

  acao: '#4D7A43',
  textoDaAcao: '#FCF5EA',
  sombraDaAcao: '#325028',
  acaoRega: '#356A9A',
  sombraDaAcaoRega: '#234766',

  barraDeAbas: '#FBF3E6',
  bordaDaBarra: '#EAD9BF',
  abaInativa: '#76644F',

  superficie: '#FFFCF5',
  bordaSuave: '#EAD9BF',
  erro: '#A4472E',
  /** O véu escuro atrás de um modal: o texto da paleta, quase transparente, para a tela de baixo sumir sem sumir. */
  veuDoModal: 'rgba(61, 51, 38, 0.46)',

  statusOk: '#4D7A43',
  statusAtencao: '#B45309',
  statusSemDados: '#8A7A68',

  /**
   * Fundos suaves para um cartão inteiro dizer em que nível a coisa está, sem depender só do texto. Sobre
   * qualquer um deles o corpo precisa usar `texto`, e não `textoApoio`: em 14 px o apoio fica abaixo dos
   * 4,5:1 de contraste nos dois tons quentes.
   */
  fundoTranquilo: '#E3EDDC',
  bordaTranquila: '#BCD2AE',
  fundoAtencao: '#FFD9AE',
  bordaDeAtencao: '#E8A765',
  fundoAlerta: '#F7E0D8',
  bordaDeAlerta: '#DFAE9D',
} as const;

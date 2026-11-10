import { EspecieVegetal, NivelDeDificuldade } from '../modelos/EspecieVegetal';
import { ExigenciasDeManejo } from '../modelos/ExigenciasDeManejo';

/** O que a classificação olha. Só isto: nada de id, nome ou foto entra na conta. */
export type CriteriosDeDificuldade = Pick<EspecieVegetal, 'intervaloDeRegaEmDias' | 'faixasIdeais'> & {
  readonly exigencias: ExigenciasDeManejo;
};

/**
 * Limites calibrados contra os 33 níveis curados do catálogo embutido. A busca varreu a grade de
 * limites e cortes e ficou com a combinação de maior acerto: 24 das 30 espécies com ficha de manejo
 * apurada (80%), contra 53% de quem classificasse tudo como fácil.
 *
 * Mudar um número aqui muda a classificação de todo o catálogo. Recalibre com dados, não por intuição.
 */
export const LIMITES = {
  /** Até este intervalo, a rega é rotina e vale 2 pontos. */
  regaExigenteEmDias: 4,
  /** Acima do limite anterior e até este, vale 1 ponto. Mais que isso perdoa esquecimento e vale 0. */
  regaModeradaEmDias: 5,
  /** Sol pleno, inalcançável dentro de casa: 2 pontos. */
  luzExigenteEmLux: 25_000,
  /** Meia-sombra para cima: 1 ponto. Abaixo disso a espécie aceita canto escuro e vale 0. */
  luzModeradaEmLux: 2_000,
} as const;

/** Somando rega (0–2), luz (0–2) e os três fatos de manejo (0–3), o total vai de 0 a 7. */
export const CORTES = {
  medioAPartirDe: 4,
  dificilAPartirDe: 5,
} as const;

/**
 * Classifica a espécie a partir de critérios verificáveis, em vez de um valor escrito à mão.
 *
 * Os três fatos de manejo valem 1 ponto cada e, juntos, pesam tanto quanto rega e luz somadas.
 * É proposital: o que torna uma planta trabalhosa em casa raramente é a faixa ideal dela, e sim
 * praga que exige intervenção, rega que mata por excesso e poda que não dá para pular.
 */
export function classificarDificuldade(especie: CriteriosDeDificuldade): NivelDeDificuldade {
  const pontos = pontosDaRega(especie) + pontosDaLuz(especie) + pontosDoManejo(especie);
  if (pontos >= CORTES.dificilAPartirDe) return 'dificil';
  if (pontos >= CORTES.medioAPartirDe) return 'medio';
  return 'facil';
}

/**
 * O que a classificação consegue explicar. `exigencias` em null é ficha de manejo ainda não pesquisada: aí
 * sobram os motivos que o catálogo mede sozinho, rega e luz. Pontuar sem ficha seria errado — um fato em
 * branco baixaria a dificuldade —, mas explicar o que já se sabe não é.
 */
export type CriteriosParaMotivos = Pick<EspecieVegetal, 'intervaloDeRegaEmDias' | 'faixasIdeais'> & {
  readonly exigencias: ExigenciasDeManejo | null;
};

/** Tudo que a classificação sabe apontar como exigente. O texto de cada um fica na apresentação. */
export const MOTIVOS_DA_DIFICULDADE = [
  'rega-frequente',
  'sol-pleno',
  'controle-de-praga',
  'encharcamento',
  'manejo-estrutural',
] as const;
export type MotivoDaDificuldade = (typeof MOTIVOS_DA_DIFICULDADE)[number];

/**
 * Por que a espécie é exigente, para a tela poder explicar o selo. Devolve identificadores, não frases: o
 * texto que a pessoa lê mora na apresentação, junto com o resto dos textos do app, e o domínio não decide
 * português. A ordem é a da leitura — primeiro o que o catálogo mede, depois o que a ficha de manejo diz.
 */
export function motivosDaDificuldade(especie: CriteriosParaMotivos): readonly MotivoDaDificuldade[] {
  const motivos: MotivoDaDificuldade[] = [];
  if (especie.intervaloDeRegaEmDias <= LIMITES.regaExigenteEmDias) motivos.push('rega-frequente');
  if (especie.faixasIdeais !== null && especie.faixasIdeais.luminosidade.minimo >= LIMITES.luzExigenteEmLux)
    motivos.push('sol-pleno');
  if (especie.exigencias === null) return motivos;

  const { exigeControleDePraga, morreComEncharcamento, exigeManejoEstrutural } = especie.exigencias;
  if (exigeControleDePraga.presente) motivos.push('controle-de-praga');
  if (morreComEncharcamento.presente) motivos.push('encharcamento');
  if (exigeManejoEstrutural.presente) motivos.push('manejo-estrutural');
  return motivos;
}

function pontosDaRega({ intervaloDeRegaEmDias }: CriteriosDeDificuldade): number {
  if (intervaloDeRegaEmDias <= LIMITES.regaExigenteEmDias) return 2;
  if (intervaloDeRegaEmDias <= LIMITES.regaModeradaEmDias) return 1;
  return 0;
}

function pontosDaLuz({ faixasIdeais }: CriteriosDeDificuldade): number {
  // Espécie sem faixa não pesa: a falta de dado não torna a planta difícil.
  if (faixasIdeais === null) return 0;
  const { minimo } = faixasIdeais.luminosidade;
  if (minimo >= LIMITES.luzExigenteEmLux) return 2;
  if (minimo >= LIMITES.luzModeradaEmLux) return 1;
  return 0;
}

function pontosDoManejo({ exigencias }: CriteriosDeDificuldade): number {
  return (
    Number(exigencias.exigeControleDePraga.presente) +
    Number(exigencias.morreComEncharcamento.presente) +
    Number(exigencias.exigeManejoEstrutural.presente)
  );
}

import { EspecieVegetal, NivelDeDificuldade } from '../modelos/EspecieVegetal';
import { ExigenciasDeManejo } from '../modelos/ExigenciasDeManejo';

/**
 * O que a classificação olha. Só isto: nada de id, nome ou foto entra na conta.
 *
 * `exigencias` em null é espécie sem ficha de manejo pesquisada, e aí o critério de manejo pontua 0. Vale
 * saber o que isso faz: sem ficha o total não passa de 4 pontos — rega 2 mais luz 2 — e o corte de exigente
 * é 5, então **espécie sem ficha nunca é classificada como exigente**. A falta de dado empurra para baixo,
 * e é por isso que preencher ficha é o que mais melhora a classificação.
 */
export type CriteriosDeDificuldade = Pick<EspecieVegetal, 'intervaloDeRegaEmDias' | 'faixasIdeais'> & {
  readonly exigencias: ExigenciasDeManejo | null;
};

/**
 * De onde cada limite vem:
 *
 * - **Rega**: calibrados contra os níveis curados do catálogo, varrendo a grade de limites e cortes.
 * - **Luz**: não vêm de calibração. São as bandas da tabela de DLI da Iowa State Extension, a mesma fonte
 *   das faixas de `luzDiaria` no catálogo — "luz muito alta" vale 2 e "luz alta" vale 1.
 *
 * Com as 32 fichas de manejo preenchidas, a classificação **concorda com o gabarito curado em 24 das 32
 * espécies com ficha (75%)**, contra 58% de quem classificasse tudo como fácil, e acerta a contagem de
 * exigentes: 6, as mesmas 6 do catálogo menos a orquídea, mais o orégano.
 *
 * As divergências têm um padrão: ornamentais de sombra (antúrio, begônia, samambaia, orquídea) a conta
 * rebaixa, porque pouca luz pontua 0 e a dificuldade delas vem de umidade do ar e substrato, que nenhum
 * critério aqui mede; ervas de sol pleno (orégano, alecrim, capim-limão, boldo) ela sobe, porque DLI alto
 * pontua 2. A orquídea é miss estrutural: com base 0 de rega e luz, nem os três fatos em `true` a tirariam
 * de fácil.
 *
 * Mudar um número aqui muda a classificação de todo o catálogo. Recalibre com dados, não por intuição.
 */
export const LIMITES = {
  /** Até este intervalo, a rega é rotina e vale 2 pontos. */
  regaExigenteEmDias: 4,
  /** Acima do limite anterior e até este, vale 1 ponto. Mais que isso perdoa esquecimento e vale 0. */
  regaModeradaEmDias: 5,
  /**
   * Luz diária (DLI) em mol/m²/dia, o total que a espécie precisa somar ao longo do dia. É melhor medida de
   * exigência que o lux de um instante: lux alto por pouco tempo não sustenta a planta, e sombra por muitas
   * horas sustenta. "Luz muito alta" na tabela da fonte, que dentro de casa só a janela certa alcança: 2 pontos.
   */
  luzDiariaMuitoAlta: 18,
  /** "Luz alta" na mesma tabela, que uma janela boa resolve: 1 ponto. Abaixo disso, 0 — sombra é fácil de dar. */
  luzDiariaAlta: 12,
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
export function motivosDaDificuldade(especie: CriteriosDeDificuldade): readonly MotivoDaDificuldade[] {
  const motivos: MotivoDaDificuldade[] = [];
  if (especie.intervaloDeRegaEmDias <= LIMITES.regaExigenteEmDias) motivos.push('rega-frequente');
  if (especie.faixasIdeais !== null && pontosDaLuzDiaria(especie.faixasIdeais.luzDiaria.minimo) === 2)
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
  return pontosDaLuzDiaria(faixasIdeais.luzDiaria.minimo);
}

/** Separado porque os motivos precisam da mesma conta, sem repetir os limites. */
function pontosDaLuzDiaria(dliMinimo: number): number {
  if (dliMinimo >= LIMITES.luzDiariaMuitoAlta) return 2;
  if (dliMinimo >= LIMITES.luzDiariaAlta) return 1;
  return 0;
}

function pontosDoManejo({ exigencias }: CriteriosDeDificuldade): number {
  // Sem ficha não há fato nenhum a contar. Ver o comentário de `CriteriosDeDificuldade` para o efeito disso.
  if (exigencias === null) return 0;
  return (
    Number(exigencias.exigeControleDePraga.presente) +
    Number(exigencias.morreComEncharcamento.presente) +
    Number(exigencias.exigeManejoEstrutural.presente)
  );
}

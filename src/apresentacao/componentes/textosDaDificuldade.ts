import { NivelDeDificuldade } from '@/dominio/modelos/EspecieVegetal';
import {
  CriteriosDeDificuldade,
  MotivoDaDificuldade,
  motivosDaDificuldade,
} from '@/dominio/regras/ClassificadorDeDificuldade';
import { CORES } from '../tema/cores';

/** Cada motivo é uma frase inteira e começa em maiúscula, **sem** o ponto final: quem monta a observação põe. */
export const TEXTO_DO_MOTIVO: Record<MotivoDaDificuldade, string> = {
  'rega-frequente': 'Necessita de rega frequente',
  'sol-pleno': 'Necessita de sol pleno',
  'controle-de-praga': 'Necessita de controle de praga',
  encharcamento: 'Cuidado com encharcamento. A planta morre se encharcar',
  'manejo-estrutural': 'Necessita de poda ou tutor',
};

/**
 * Como cada nível aparece: o selo, o que o leitor de tela fala, a cor do selo sobre fundo claro e o par de
 * cores de quando o nível tinge um cartão inteiro.
 *
 * `cor` serve ao selo sobre superfície clara; `fundo` e `borda`, ao cartão do detalhe, que o nível tinge
 * inteiro. Quem decide entre as duas situações é o `SeloDeDificuldade`, e o porquê está documentado nele:
 * sobre o fundo do próprio nível a `cor` fica abaixo dos 4,5:1 de contraste (3,78:1 no médio).
 */
export const APRESENTACAO_DA_DIFICULDADE: Record<
  NivelDeDificuldade,
  { curto: string; falado: string; cor: string; fundo: string; borda: string }
> = {
  facil: {
    curto: 'fácil',
    falado: 'Fácil de cuidar',
    cor: CORES.statusOk,
    fundo: CORES.fundoTranquilo,
    borda: CORES.bordaTranquila,
  },
  medio: {
    curto: 'médio',
    falado: 'Dificuldade média',
    cor: CORES.statusAtencao,
    fundo: CORES.fundoAtencao,
    borda: CORES.bordaDeAtencao,
  },
  dificil: {
    curto: 'exigente',
    falado: 'Exige bastante cuidado',
    cor: CORES.erro,
    fundo: CORES.fundoAlerta,
    borda: CORES.bordaDeAlerta,
  },
};

/** O que a tela mostra quando o selo é médio ou difícil. */
export interface ObservacaoDaDificuldade {
  /** Um item por marcador, sem ponto final: a tela desenha a lista. */
  readonly itens: readonly string[];
  /**
   * A mesma informação em uma frase. O leitor de tela não deve ouvir "marcador" a cada linha, e o selo do
   * nível não é falado sozinho — por isso aqui a frase começa pelo nível.
   */
  readonly falado: string;
}

/** Quando nem a rega nem a luz pesam e a ficha de manejo ainda não existe, é só isto que dá para dizer. */
const SEM_MOTIVO_CONHECIDO = 'Exige cuidados que o catálogo ainda não detalha';

/**
 * A observação que explica o selo, só para médio e difícil: em fácil não há o que justificar, e uma lista
 * em toda espécie viraria ruído.
 *
 * Os motivos saem em itens, não numa frase corrida: cada texto de `TEXTO_DO_MOTIVO` já é uma frase inteira,
 * e emendar duas daquelas com vírgula e "e" sai torto ("Necessita de rega frequente e Necessita de sol
 * pleno"). Em lista, cada um fica no seu lugar e dá para bater o olho e contar quantos são.
 *
 * A lista nunca vem vazia: sem motivo conhecido, o item é a própria admissão de que o catálogo não detalha.
 */
export function observacaoDaDificuldade(
  nivel: NivelDeDificuldade,
  especie: CriteriosDeDificuldade,
): ObservacaoDaDificuldade | null {
  if (nivel === 'facil') return null;
  const motivos = motivosDaDificuldade(especie).map((motivo) => TEXTO_DO_MOTIVO[motivo]);
  const itens = motivos.length === 0 ? [SEM_MOTIVO_CONHECIDO] : motivos;
  const inicio = comMaiuscula(APRESENTACAO_DA_DIFICULDADE[nivel].curto);
  return { itens, falado: `${inicio}: ${itens.map((item) => `${item}.`).join(' ')}` };
}

const comMaiuscula = (texto: string): string => texto.charAt(0).toUpperCase() + texto.slice(1);

import { NivelDeDificuldade } from '@/dominio/modelos/EspecieVegetal';
import {
  CriteriosParaMotivos,
  MotivoDaDificuldade,
  motivosDaDificuldade,
} from '@/dominio/regras/ClassificadorDeDificuldade';
import { CORES } from '../tema/cores';

/** O texto de cada motivo, já na forma em que ele entra na frase da observação. */
export const TEXTO_DO_MOTIVO: Record<MotivoDaDificuldade, string> = {
  'rega-frequente': 'Necessita de rega frequente',
  'sol-pleno': 'Necessita de sol pleno',
  'controle-de-praga': 'Necessita de controle de praga',
  encharcamento: 'Cuidado com encharcamento. A planta morre se encharcar',
  'manejo-estrutural': 'Necessita de poda ou tutor',
};

/** Como cada nível aparece: o selo ao lado do nome, o que o leitor de tela fala e a cor do selo. */
export const APRESENTACAO_DA_DIFICULDADE: Record<
  NivelDeDificuldade,
  { curto: string; falado: string; cor: string }
> = {
  facil: { curto: 'fácil', falado: 'Fácil de cuidar', cor: CORES.statusOk },
  medio: { curto: 'médio', falado: 'Dificuldade média', cor: CORES.statusAtencao },
  dificil: { curto: 'difícil', falado: 'Difícil de cuidar', cor: CORES.erro },
};

/**
 * A observação que explica o selo, só para médio e difícil: em fácil não há o que justificar, e uma linha
 * em toda espécie viraria ruído na lista.
 *
 * A frase começa pelo nível e lista os motivos, em vez de tentar uma oração com todos eles: os textos de
 * `TEXTO_DO_MOTIVO` têm formas gramaticais diferentes ("rega frequente", "morre se encharcar") e emendá-los
 * numa frase só sairia torto.
 */
export function observacaoDaDificuldade(
  nivel: NivelDeDificuldade,
  especie: CriteriosParaMotivos,
): string | null {
  if (nivel === 'facil') return null;
  const inicio = comMaiuscula(APRESENTACAO_DA_DIFICULDADE[nivel].curto);
  const motivos = motivosDaDificuldade(especie).map((motivo) => TEXTO_DO_MOTIVO[motivo]);
  // Sem ficha de manejo e sem rega ou luz exigentes, o selo vem do catálogo e não há motivo a citar.
  if (motivos.length === 0) return `${inicio}: exige cuidados que o catálogo ainda não detalha.`;
  return `${inicio}: ${enumerar(motivos)}.`;
}

/** "a", "a e b", "a, b e c": o "e" antes do último, como se escreve em português. */
function enumerar(itens: readonly string[]): string {
  if (itens.length === 1) return itens[0];
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}


const comMaiuscula = (texto: string): string => texto.charAt(0).toUpperCase() + texto.slice(1);

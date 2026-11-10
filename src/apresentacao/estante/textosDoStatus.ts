import { StatusDaPlanta } from '@/dominio/regras/StatusDaPlanta';
import { TEXTOS } from '@/textos';
import { CORES } from '../tema/cores';

/** Como cada status aparece: o texto curto da etiqueta, o que o leitor de tela fala e a cor do ponto. */
export const APRESENTACAO_DO_STATUS: Record<StatusDaPlanta, { curto: string; falado: string; cor: string }> = {
  ok: { ...TEXTOS.status.ok, cor: CORES.statusOk },
  atencao: { ...TEXTOS.status.atencao, cor: CORES.statusAtencao },
  'sem-dados': { ...TEXTOS.status.semDados, cor: CORES.statusSemDados },
};

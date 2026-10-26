import { StatusDaPlanta } from '@/dominio/regras/StatusDaPlanta';
import { CORES } from '../tema/cores';

/** Como cada status aparece: o texto curto da etiqueta, o que o leitor de tela fala e a cor do ponto. */
export const APRESENTACAO_DO_STATUS: Record<StatusDaPlanta, { curto: string; falado: string; cor: string }> = {
  ok: { curto: 'ok', falado: 'Ok', cor: CORES.statusOk },
  atencao: { curto: 'atenção', falado: 'Precisa de atenção', cor: CORES.statusAtencao },
  'sem-dados': { curto: 'sem dados', falado: 'Sem dados', cor: CORES.statusSemDados },
};

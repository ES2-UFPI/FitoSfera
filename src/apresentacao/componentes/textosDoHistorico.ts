import { SituacaoDaRega } from '@/dominio/regras/ProximaRega';
import { TEXTOS } from '@/textos';

/** O quando de uma rega, em tempo relativo: "hoje", "ontem" ou "há N dias". */
export function descreverQuandoRegou(diasAtras: number): string {
  if (diasAtras === 0) return TEXTOS.historico.hoje;
  if (diasAtras === 1) return TEXTOS.historico.ontem;
  return TEXTOS.historico.haDias(diasAtras);
}

/** Quando a próxima rega vence, em tempo relativo. Undefined quando não há prazo para anunciar. */
export function descreverProximaRega({ proximaEm, diasAteAProxima }: SituacaoDaRega): string | undefined {
  if (proximaEm === null || diasAteAProxima === null) return undefined;
  if (diasAteAProxima < 0) {
    return TEXTOS.historico.atrasada(-diasAteAProxima);
  }
  if (diasAteAProxima === 0) return TEXTOS.historico.eHoje;
  return diasAteAProxima === 1 ? TEXTOS.historico.eAmanha : TEXTOS.historico.emDias(diasAteAProxima);
}

export function descreverTempoNoJardim(dias: number): string {
  if (dias === 0) return TEXTOS.historico.chegouHoje;
  return TEXTOS.historico.diasNoJardim(dias);
}

export function descreverTempoDesdeOPlantio(dias: number): string {
  return dias === 0 ? TEXTOS.historico.plantadaHoje : TEXTOS.historico.diasDesdeOPlantio(dias);
}

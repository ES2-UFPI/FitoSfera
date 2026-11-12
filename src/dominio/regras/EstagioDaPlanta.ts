import { EspecieVegetal, EstagioDeDesenvolvimento } from '@/dominio/modelos/EspecieVegetal';
import { Planta } from '@/dominio/modelos/Planta';
import { diasNoJardim } from './TempoNoJardim';

/** Devolve o estágio atual conforme os dias desde o cadastro, ou null quando não há dados suficientes. */
export function estagioDaPlanta(
  planta: Planta,
  especie: EspecieVegetal,
  agora: Date,
): EstagioDeDesenvolvimento | null {
  if (Number.isNaN(agora.getTime()) || planta.cadastradaEm === null || Number.isNaN(planta.cadastradaEm.getTime())) {
    return null;
  }
  const dias = diasNoJardim(planta.cadastradaEm, agora);
  const estagios = especie.estagiosDeDesenvolvimento;
  if (dias === null || estagios === undefined || estagios.length === 0) return null;

  let fimDoEstagio = 0;
  for (const estagio of estagios) {
    fimDoEstagio += estagio.duracaoEmDias;
    if (dias < fimDoEstagio) return estagio;
  }

  return estagios[estagios.length - 1] ?? null;
}

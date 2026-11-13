import { EspecieVegetal, EstagioDeDesenvolvimento } from '@/dominio/modelos/EspecieVegetal';
import { Planta } from '@/dominio/modelos/Planta';
import { diasDesde } from './TempoNoJardim';

/** Estima a fase atual pelo plantio ou pelo início da floração produtiva, ou null quando faltam dados. */
export function estagioDaPlanta(
  planta: Planta,
  especie: EspecieVegetal,
  agora: Date,
): EstagioDeDesenvolvimento | null {
  if (Number.isNaN(agora.getTime())) return null;
  const dataDeReferencia = planta.colheitaIniciada ? planta.floracaoIniciadaEm : planta.plantadaEm;
  if (dataDeReferencia === null || Number.isNaN(dataDeReferencia.getTime())) {
    return null;
  }
  const estagios = especie.estagiosDeDesenvolvimento;
  if (estagios === undefined || estagios.length === 0) return null;

  const indiceInicial = planta.colheitaIniciada ? estagios.findIndex((estagio) => /flor/i.test(estagio.nome)) : 0;
  if (indiceInicial < 0) return null;
  const dias = diasDesde(dataDeReferencia, agora);
  let fimDoEstagio = 0;
  for (const estagio of estagios.slice(indiceInicial)) {
    fimDoEstagio += estagio.duracaoEmDias;
    if (dias < fimDoEstagio) return estagio;
  }

  return estagios[estagios.length - 1] ?? null;
}

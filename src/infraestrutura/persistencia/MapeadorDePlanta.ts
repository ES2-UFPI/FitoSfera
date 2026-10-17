import { normalizarAparencia } from '@/dominio/modelos/Aparencia';
import { Planta } from '@/dominio/modelos/Planta';

export interface RegistroDePlanta {
  id: string;
  idEspecie: string;
  apelido: string;
  aparencia: { forma: string; folhagem: string; destaque: string; vaso: string };
  /** Data e hora do cadastro em ISO 8601, ou null quando desconhecida. */
  cadastradaEm: string | null;
}

export function paraRegistro(planta: Planta): RegistroDePlanta {
  return {
    id: planta.id,
    idEspecie: planta.idEspecie,
    apelido: planta.apelido,
    aparencia: { ...planta.aparencia },
    cadastradaEm: planta.cadastradaEm?.toISOString() ?? null,
  };
}

/** Devolve null para o que não dá para ler, em vez de derrubar a listagem inteira. */
export function deRegistro(bruto: unknown): Planta | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const { id, idEspecie, apelido, aparencia, cadastradaEm } = bruto as Record<string, unknown>;
  if (typeof id !== 'string' || typeof idEspecie !== 'string' || typeof apelido !== 'string') return null;
  try {
    return Planta.criar({
      id,
      idEspecie,
      apelido,
      aparencia: normalizarAparencia(aparencia),
      cadastradaEm: lerData(cadastradaEm),
    });
  } catch {
    return null;
  }
}

/** Registro antigo, sem data, ou com data que não dá para ler: a planta continua, com data desconhecida. */
function lerData(bruto: unknown): Date | null {
  if (typeof bruto !== 'string') return null;
  const data = new Date(bruto);
  return Number.isNaN(data.getTime()) ? null : data;
}

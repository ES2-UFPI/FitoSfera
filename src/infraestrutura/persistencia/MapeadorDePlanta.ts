import { normalizarAparencia } from '@/dominio/modelos/Aparencia';
import { Planta } from '@/dominio/modelos/Planta';

export interface RegistroDePlanta {
  id: string;
  idEspecie: string;
  apelido: string;
  aparencia: { forma: string; folhagem: string; destaque: string; vaso: string };
}

export function paraRegistro(planta: Planta): RegistroDePlanta {
  return {
    id: planta.id,
    idEspecie: planta.idEspecie,
    apelido: planta.apelido,
    aparencia: { ...planta.aparencia },
  };
}

/** Devolve null para o que não dá para ler, em vez de derrubar a listagem inteira. */
export function deRegistro(bruto: unknown): Planta | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const { id, idEspecie, apelido, aparencia } = bruto as Record<string, unknown>;
  if (typeof id !== 'string' || typeof idEspecie !== 'string' || typeof apelido !== 'string') return null;
  try {
    return Planta.criar({ id, idEspecie, apelido, aparencia: normalizarAparencia(aparencia) });
  } catch {
    return null;
  }
}

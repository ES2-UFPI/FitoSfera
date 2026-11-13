import { normalizarAparencia } from '@/dominio/modelos/Aparencia';
import { FaixaRecomendada, FaixasRecomendadas } from '@/dominio/modelos/FaixaRecomendada';
import { ID_JARDIM_PRINCIPAL, Planta } from '@/dominio/modelos/Planta';

export interface RegistroDePlanta {
  id: string;
  idJardim: string;
  idEspecie: string;
  apelido: string;
  aparencia: { forma: string; folhagem: string; destaque: string; vaso: string };
  /** Data e hora do cadastro em ISO 8601, ou null quando desconhecida. */
  cadastradaEm: string | null;
  /** Data aproximada de plantio da muda em ISO 8601; null quando desconhecida. */
  plantadaEm: string | null;
  /** Se a primeira colheita já começou; ausente em registros antigos equivale a false. */
  colheitaIniciada: boolean;
  /** Início aproximado da floração produtiva atual em ISO 8601, ou null quando desconhecido. */
  floracaoIniciadaEm: string | null;
  /** Faixas copiadas da espécie no cadastro (desde a versão 2), ou null quando a espécie não tinha faixa. */
  faixasRecomendadas: FaixasRecomendadas | null;
  /** Intervalo de rega copiado da espécie, em dias; null em registro gravado antes deste campo existir. */
  intervaloDeRegaEmDias: number | null;
}

export function paraRegistro(planta: Planta): RegistroDePlanta {
  return {
    id: planta.id,
    idJardim: planta.idJardim,
    idEspecie: planta.idEspecie,
    apelido: planta.apelido,
    aparencia: { ...planta.aparencia },
    cadastradaEm: planta.cadastradaEm?.toISOString() ?? null,
    plantadaEm: planta.plantadaEm?.toISOString() ?? null,
    colheitaIniciada: planta.colheitaIniciada,
    floracaoIniciadaEm: planta.floracaoIniciadaEm?.toISOString() ?? null,
    faixasRecomendadas: planta.faixasRecomendadas,
    intervaloDeRegaEmDias: planta.intervaloDeRegaEmDias,
  };
}

/** Devolve null para o que não dá para ler, em vez de derrubar a listagem inteira. */
export function deRegistro(bruto: unknown): Planta | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const { id, idJardim, idEspecie, apelido, aparencia, cadastradaEm, plantadaEm, colheitaIniciada, floracaoIniciadaEm, faixasRecomendadas, intervaloDeRegaEmDias } =
    bruto as Record<string, unknown>;
  if (typeof id !== 'string' || typeof idEspecie !== 'string' || typeof apelido !== 'string') return null;
  try {
    return Planta.criar({
      id,
      idJardim: typeof idJardim === 'string' && idJardim.length > 0 ? idJardim : ID_JARDIM_PRINCIPAL,
      idEspecie,
      apelido,
      aparencia: normalizarAparencia(aparencia),
      cadastradaEm: lerData(cadastradaEm),
      plantadaEm: lerData(plantadaEm),
      colheitaIniciada: colheitaIniciada === true,
      floracaoIniciadaEm: lerData(floracaoIniciadaEm),
      faixasRecomendadas: lerFaixas(faixasRecomendadas),
      intervaloDeRegaEmDias: lerIntervalo(intervaloDeRegaEmDias),
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

/**
 * Registro antigo, sem intervalo, ou com intervalo que não dá para usar: a planta continua, e quem calcula a
 * próxima rega busca o intervalo na espécie do catálogo. Como `idJardim`, o campo novo não exige nova versão
 * do schema; ele é gravado na próxima vez que o registro for salvo.
 */
function lerIntervalo(bruto: unknown): number | null {
  if (typeof bruto !== 'number' || !Number.isInteger(bruto) || bruto <= 0) return null;
  return bruto;
}

/**
 * Faixas do dia ausentes ou malformadas deixam a planta sem faixas (status "sem dados"), sem perder o registro.
 * As faixas da versão 4 são opcionais: uma que não dá para ler só fica de fora.
 */
function lerFaixas(bruto: unknown): FaixasRecomendadas | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const campos = bruto as Record<string, unknown>;
  const faixas = [campos.umidadeDoAr, campos.temperatura, campos.luminosidade].map(lerFaixa);
  if (faixas.some((faixa) => faixa === null)) return null;
  const [umidade, temperaturaLida, luz] = faixas as FaixaRecomendada[];
  const opcionais = Object.fromEntries(
    FAIXAS_DA_VERSAO_4.flatMap((nome) => {
      const faixa = lerFaixa(campos[nome]);
      return faixa === null ? [] : [[nome, faixa]];
    }),
  );
  return { umidadeDoAr: umidade, temperatura: temperaturaLida, luminosidade: luz, ...opcionais };
}

const FAIXAS_DA_VERSAO_4 = ['luzDiaria', 'umidadeDoArNoturna', 'temperaturaNoturna'] as const;

function lerFaixa(bruto: unknown): FaixaRecomendada | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const { minimo, maximo } = bruto as Record<string, unknown>;
  const ehNumero = (valor: unknown): valor is number => typeof valor === 'number' && Number.isFinite(valor);
  return ehNumero(minimo) && ehNumero(maximo) && minimo <= maximo ? { minimo, maximo } : null;
}

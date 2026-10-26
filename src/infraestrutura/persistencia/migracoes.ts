import { copiarFaixas } from '@/dominio/modelos/FaixaRecomendada';
import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';
import { RepositorioDeEspeciesLocal } from '../catalogo/RepositorioDeEspeciesLocal';
import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES, CHAVES_DA_VERSAO_0, CHAVES_DA_VERSAO_1 } from './chaves';

/**
 * Leva os dados da versão `paraVersao - 1` para `paraVersao`. Precisa poder rodar de novo sem estrago:
 * se o app fechar no meio, a versão gravada não muda e a migração recomeça na próxima abertura.
 */
export interface Migracao {
  readonly paraVersao: number;
  aplicar(armazenamento: ArmazenamentoChaveValor): Promise<void>;
}

/**
 * 0 → 1: as plantas saem de `@fitosfera/plantas` para `fitosfera:v1:plantas`, com os registros intactos.
 * A chave antiga fica onde está, como cópia de segurança.
 */
export const MIGRACAO_PARA_VERSAO_1: Migracao = {
  paraVersao: 1,
  aplicar: (armazenamento) => moverPlantas(armazenamento, CHAVES_DA_VERSAO_0, CHAVES_DA_VERSAO_1),
};

/**
 * 1 → 2: as plantas passam a guardar as faixas recomendadas (#23). Quem foi cadastrado antes ganha uma cópia
 * das faixas que a espécie tem no catálogo no momento da migração; espécie fora do catálogo fica com null.
 */
export function criarMigracaoParaVersao2(especies: RepositorioDeEspecies): Migracao {
  return {
    paraVersao: 2,
    aplicar: (armazenamento) =>
      moverPlantas(armazenamento, CHAVES_DA_VERSAO_1, CHAVES, (registros) =>
        Promise.all(registros.map((registro) => acrescentarFaixas(registro, especies))),
      ),
  };
}

export const MIGRACOES: readonly Migracao[] = [
  MIGRACAO_PARA_VERSAO_1,
  criarMigracaoParaVersao2(new RepositorioDeEspeciesLocal()),
];

interface ChavesDasPlantas {
  readonly plantas: string;
  readonly plantasIlegiveis: string;
}

/**
 * Leva a lista de plantas (e a cópia do conteúdo ilegível) de uma versão para a seguinte. Conteúdo que não é
 * lista vai como estava; o repositório cuida dele na próxima gravação.
 */
async function moverPlantas(
  armazenamento: ArmazenamentoChaveValor,
  de: ChavesDasPlantas,
  para: ChavesDasPlantas,
  converter?: (registros: unknown[]) => Promise<unknown[]>,
): Promise<void> {
  const antigas = await armazenamento.getItem(de.plantas);
  if (antigas !== null) {
    const lista = lerLista(antigas);
    const convertidas = converter && lista !== null ? JSON.stringify(await converter(lista)) : antigas;
    const atuais = await armazenamento.getItem(para.plantas);
    const juntas = atuais === null ? convertidas : juntarListas(convertidas, atuais);
    if (juntas !== atuais) await armazenamento.setItem(para.plantas, juntas);
  }

  const ilegiveis = await armazenamento.getItem(de.plantasIlegiveis);
  if (ilegiveis !== null && (await armazenamento.getItem(para.plantasIlegiveis)) === null)
    await armazenamento.setItem(para.plantasIlegiveis, ilegiveis);
}

/** Só mexe em registro de planta que ainda não tem o campo; o resto passa intacto. */
async function acrescentarFaixas(registro: unknown, especies: RepositorioDeEspecies): Promise<unknown> {
  if (typeof registro !== 'object' || registro === null || Array.isArray(registro)) return registro;
  const campos = registro as Record<string, unknown>;
  if ('faixasRecomendadas' in campos || typeof campos.idEspecie !== 'string') return registro;
  const especie = await especies.obterPorId(campos.idEspecie);
  return { ...campos, faixasRecomendadas: copiarFaixas(especie?.faixasIdeais ?? null) };
}

/**
 * Uma tentativa anterior pode ter parado depois de o app já gravar na chave nova. Junta as duas listas,
 * antigas primeiro, sem repetir id. Se alguma não for uma lista, mantém a atual: a antiga continua salva.
 */
function juntarListas(antigas: string, atuais: string): string {
  const listaAntiga = lerLista(antigas);
  const listaAtual = lerLista(atuais);
  if (listaAntiga === null || listaAtual === null) return atuais;
  const idsAtuais = new Set(listaAtual.map(idDoRegistro));
  const faltantes = listaAntiga.filter((registro) => !idsAtuais.has(idDoRegistro(registro)));
  return faltantes.length === 0 ? atuais : JSON.stringify([...faltantes, ...listaAtual]);
}

function lerLista(bruto: string): unknown[] | null {
  try {
    const conteudo: unknown = JSON.parse(bruto);
    return Array.isArray(conteudo) ? conteudo : null;
  } catch {
    return null;
  }
}

function idDoRegistro(registro: unknown): unknown {
  return typeof registro === 'object' && registro !== null ? (registro as { id?: unknown }).id : undefined;
}

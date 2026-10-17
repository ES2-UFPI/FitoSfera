import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES, CHAVES_DA_VERSAO_0 } from './chaves';

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
  async aplicar(armazenamento) {
    const antigas = await armazenamento.getItem(CHAVES_DA_VERSAO_0.plantas);
    if (antigas !== null) {
      const atuais = await armazenamento.getItem(CHAVES.plantas);
      const juntas = atuais === null ? antigas : juntarListas(antigas, atuais);
      if (juntas !== atuais) await armazenamento.setItem(CHAVES.plantas, juntas);
    }

    const ilegiveis = await armazenamento.getItem(CHAVES_DA_VERSAO_0.plantasIlegiveis);
    if (ilegiveis !== null && (await armazenamento.getItem(CHAVES.plantasIlegiveis)) === null)
      await armazenamento.setItem(CHAVES.plantasIlegiveis, ilegiveis);
  },
};

export const MIGRACOES: readonly Migracao[] = [MIGRACAO_PARA_VERSAO_1];

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

import { RepositorioDeAvisos } from '@/dominio/portas/RepositorioDeAvisos';
import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES } from './chaves';

/**
 * Guarda num objeto JSON (`fitosfera:v2:avisos`) a assinatura do desvio já avisado de cada planta. O mapa é
 * gravado inteiro: ele é pequeno (uma linha por planta com desvio em aberto) e some junto com o desvio.
 *
 * Conteúdo ilegível é lido como mapa vazio e sobrescrito na próxima gravação, sem cópia `:ilegivel`: aqui
 * não há dado da pessoa para preservar, e o pior que acontece é um aviso se repetir uma vez.
 */
export class RepositorioDeAvisosAsyncStorage implements RepositorioDeAvisos {
  constructor(private readonly armazenamento: ArmazenamentoChaveValor) {}

  async listar(): Promise<ReadonlyMap<string, string>> {
    const bruto = await this.armazenamento.getItem(CHAVES.avisos);
    if (bruto === null) return new Map();
    try {
      const conteudo: unknown = JSON.parse(bruto);
      if (typeof conteudo !== 'object' || conteudo === null || Array.isArray(conteudo)) return new Map();
      const pares = Object.entries(conteudo).filter(
        (par): par is [string, string] => typeof par[1] === 'string',
      );
      return new Map(pares);
    } catch {
      return new Map();
    }
  }

  async gravar(assinaturas: ReadonlyMap<string, string>): Promise<void> {
    if (assinaturas.size === 0) {
      await this.armazenamento.removeItem(CHAVES.avisos);
      return;
    }
    await this.armazenamento.setItem(CHAVES.avisos, JSON.stringify(Object.fromEntries(assinaturas)));
  }
}

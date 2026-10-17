import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';
import catalogo from './catalogo-plantas.json';
import { normalizarTexto } from './NormalizadorDeTexto';

interface EspecieIndexada {
  readonly especie: EspecieVegetal;
  readonly chaveDeOrdem: string;
  readonly nomesBuscaveis: readonly string[];
}

/** Conferido por validarCatalogo nos testes; o JSON só não tem como dizer que o nível é uma das três opções. */
const CATALOGO = catalogo as readonly EspecieVegetal[];

/** Catálogo embutido no app. Ordena e busca sem depender do suporte a Intl do motor JavaScript. */
export class RepositorioDeEspeciesLocal implements RepositorioDeEspecies {
  private readonly indice: readonly EspecieIndexada[];

  constructor(especies: readonly EspecieVegetal[] = CATALOGO) {
    this.indice = especies
      .map((especie) => ({
        especie,
        chaveDeOrdem: normalizarTexto(especie.nomeComum),
        nomesBuscaveis: [especie.nomeComum, especie.nomeCientifico, ...especie.nomesAlternativos].map(normalizarTexto),
      }))
      .sort((a, b) => (a.chaveDeOrdem < b.chaveDeOrdem ? -1 : a.chaveDeOrdem > b.chaveDeOrdem ? 1 : 0));
  }

  async listarTodas(): Promise<readonly EspecieVegetal[]> {
    return this.indice.map((item) => item.especie);
  }

  async obterPorId(id: string): Promise<EspecieVegetal | null> {
    return this.indice.find((item) => item.especie.id === id)?.especie ?? null;
  }

  async pesquisar(termo: string): Promise<readonly EspecieVegetal[]> {
    const procurado = normalizarTexto(termo);
    if (procurado === '') return this.listarTodas();
    return this.indice
      .filter((item) => item.nomesBuscaveis.some((nome) => nome.includes(procurado)))
      .map((item) => item.especie);
  }
}

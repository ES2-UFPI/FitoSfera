import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';
import { classificarDificuldade } from '@/dominio/regras/ClassificadorDeDificuldade';
import catalogo from './catalogo-plantas.json';
import fichasDeManejo from './exigencias-de-manejo.json';
import { normalizarTexto } from './NormalizadorDeTexto';
import { fichaDeManejo } from './validarExigenciasDeManejo';

interface EspecieIndexada {
  readonly especie: EspecieVegetal;
  readonly chaveDeOrdem: string;
  readonly nomesBuscaveis: readonly string[];
}

/** Conferido por validarCatalogo nos testes; o JSON só não tem como dizer que o nível é uma das três opções. */
const CATALOGO = catalogo as readonly EspecieVegetal[];

/**
 * Anexa a ficha de manejo e **calcula** o nível de dificuldade, em vez de usar o `nivelDeDificuldade`
 * escrito à mão no JSON. O campo do arquivo continua existindo como gabarito da calibração; aqui ele deixa
 * de ser a resposta.
 *
 * `exigencias` ausente e `exigencias: null` são coisas diferentes aqui: ausente significa "procure a ficha
 * pelo id", e null significa "esta espécie não tem ficha", sem consultar o arquivo. É o que permite a um
 * teste trazer a própria ficha, ou nenhuma, sem depender do catálogo real.
 */
function comNivelCalculado(especie: EspecieVegetal): EspecieVegetal {
  const exigencias =
    especie.exigencias !== undefined ? especie.exigencias : fichaDeManejo(fichasDeManejo, especie.id);
  return { ...especie, exigencias, nivelDeDificuldade: classificarDificuldade({ ...especie, exigencias }) };
}

/** Catálogo embutido no app. Ordena e busca sem depender do suporte a Intl do motor JavaScript. */
export class RepositorioDeEspeciesLocal implements RepositorioDeEspecies {
  private readonly indice: readonly EspecieIndexada[];

  constructor(especies: readonly EspecieVegetal[] = CATALOGO) {
    this.indice = especies
      .map(comNivelCalculado)
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

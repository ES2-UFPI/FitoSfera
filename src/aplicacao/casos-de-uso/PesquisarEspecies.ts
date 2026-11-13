import { EspecieVegetal, ordemDaDificuldade } from '@/dominio/modelos/EspecieVegetal';
import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';

/** "Fáceis" é só o nível fácil: médio e exigente ficam de fora. */
export type FiltroDeDificuldade = 'todas' | 'somente-faceis';

/** `alfabetica` é a ordem que o repositório já entrega. */
export type OrdemDaBusca = 'alfabetica' | 'mais-faceis-primeiro';

/** Tudo opcional: sem critério nenhum, a busca é a de sempre — catálogo inteiro, em ordem alfabética. */
export interface CriteriosDaBusca {
  readonly termo?: string;
  readonly filtro?: FiltroDeDificuldade;
  readonly ordem?: OrdemDaBusca;
}

export class PesquisarEspecies {
  constructor(private readonly especies: RepositorioDeEspecies) {}

  async executar(criterios: CriteriosDaBusca = {}): Promise<readonly EspecieVegetal[]> {
    const { termo = '', filtro = 'todas', ordem = 'alfabetica' } = criterios;
    const encontradas = await this.especies.pesquisar(termo.trim());
    const filtradas =
      filtro === 'somente-faceis'
        ? encontradas.filter((especie) => especie.nivelDeDificuldade === 'facil')
        : encontradas;
    return ordem === 'mais-faceis-primeiro' ? ordenarPelaDificuldade(filtradas) : filtradas;
  }
}

/**
 * Ordena só pela escala do nível, e isso basta: o repositório entrega em ordem alfabética e `sort` é estável
 * por especificação desde o ES2019, então dentro de cada nível a ordem alfabética se mantém. Sem essa
 * garantia a lista embaralharia os nomes a cada busca.
 *
 * O nível não é recalculado aqui: quem calcula é o adaptador do catálogo, ao montar o índice.
 */
function ordenarPelaDificuldade(especies: readonly EspecieVegetal[]): readonly EspecieVegetal[] {
  return [...especies].sort(
    (a, b) => ordemDaDificuldade(a.nivelDeDificuldade) - ordemDaDificuldade(b.nivelDeDificuldade),
  );
}

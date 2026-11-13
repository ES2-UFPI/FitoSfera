import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';
import { EspecieVegetal, NivelDeDificuldade, ordemDaDificuldade } from '@/dominio/modelos/EspecieVegetal';
import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';
import { normalizarTexto } from '@/infraestrutura/catalogo/NormalizadorDeTexto';
import { RepositorioDeEspeciesLocal } from '@/infraestrutura/catalogo/RepositorioDeEspeciesLocal';
import { especieDeTeste } from '../apoio/especiesDeTeste';

/**
 * Aqui o nível é **entrada** do caso de uso, não resultado de conta: quem calcula é o adaptador do catálogo.
 * Por isso cada espécie declara o nível, e o teste não depende do classificador.
 */
function especie(nomeComum: string, nivelDeDificuldade: NivelDeDificuldade): EspecieVegetal {
  return especieDeTeste(
    { id: nomeComum.toLowerCase(), nomeComum, nomeCientifico: 'X x', nomesAlternativos: [] },
    { nivelDeDificuldade },
  );
}

// Em ordem alfabética, que é como o repositório de verdade entrega. Dois níveis repetem, para cobrar estabilidade.
const CATALOGO = [
  especie('Alface', 'facil'),
  especie('Boldo', 'medio'),
  especie('Cacto', 'facil'),
  especie('Lavanda', 'dificil'),
  especie('Morango', 'dificil'),
  especie('Tomate', 'dificil'),
];

let termoRecebido: string | null = null;

/** Repositório de mentira com o contrato do de verdade: termo vazio devolve tudo, e a saída é alfabética. */
const repositorio: RepositorioDeEspecies = {
  async listarTodas() {
    return CATALOGO;
  },
  async obterPorId(id) {
    return CATALOGO.find((item) => item.id === id) ?? null;
  },
  async pesquisar(termo) {
    termoRecebido = termo;
    if (termo === '') return CATALOGO;
    return CATALOGO.filter((item) => item.nomeComum.toLowerCase().includes(termo.toLowerCase()));
  },
};

const caso = new PesquisarEspecies(repositorio);

async function nomes(...argumentos: Parameters<PesquisarEspecies['executar']>) {
  return (await caso.executar(...argumentos)).map((item) => item.nomeComum);
}

beforeEach(() => {
  termoRecebido = null;
});

test('sem critério nenhum devolve o catálogo inteiro, na ordem alfabética do repositório', async () => {
  expect(await nomes()).toEqual(['Alface', 'Boldo', 'Cacto', 'Lavanda', 'Morango', 'Tomate']);
});

test('apara o termo antes de pesquisar', async () => {
  expect(await nomes({ termo: '  cacto  ' })).toEqual(['Cacto']);
  expect(termoRecebido).toBe('cacto');
});

test('o filtro "somente-faceis" deixa só as de nível fácil', async () => {
  expect(await nomes({ filtro: 'somente-faceis' })).toEqual(['Alface', 'Cacto']);
});

test('o filtro "todas" não esconde nada', async () => {
  expect(await nomes({ filtro: 'todas' })).toHaveLength(CATALOGO.length);
});

test('ordenar por dificuldade põe as fáceis no topo e as exigentes no fim', async () => {
  const niveis = (await caso.executar({ ordem: 'mais-faceis-primeiro' })).map((item) => item.nivelDeDificuldade);
  expect(niveis).toEqual(['facil', 'facil', 'medio', 'dificil', 'dificil', 'dificil']);
});

test('a ordenação por dificuldade é estável: dentro do nível a ordem alfabética se mantém', async () => {
  expect(await nomes({ ordem: 'mais-faceis-primeiro' })).toEqual([
    'Alface',
    'Cacto',
    'Boldo',
    'Lavanda',
    'Morango',
    'Tomate',
  ]);
});

test('o termo, o filtro e a ordem valem ao mesmo tempo', async () => {
  // "a" acha Alface, Cacto, Lavanda, Morango e Tomate; Boldo fica fora por não ter a letra.
  expect(await nomes({ termo: 'a', ordem: 'mais-faceis-primeiro' })).toEqual([
    'Alface',
    'Cacto',
    'Lavanda',
    'Morango',
    'Tomate',
  ]);
  expect(await nomes({ termo: 'a', filtro: 'somente-faceis', ordem: 'mais-faceis-primeiro' })).toEqual([
    'Alface',
    'Cacto',
  ]);
});

test('não devolve a lista do repositório mutada: ordenar não mexe no catálogo', async () => {
  await caso.executar({ ordem: 'mais-faceis-primeiro' });
  expect(CATALOGO.map((item) => item.nomeComum)).toEqual([
    'Alface',
    'Boldo',
    'Cacto',
    'Lavanda',
    'Morango',
    'Tomate',
  ]);
});

/**
 * O caminho completo, com o catálogo embutido e os níveis que o adaptador calcula. As asserções são de
 * propriedade, não de conteúdo: mexer no catálogo não deve quebrar este bloco, mexer na ordenação deve.
 */
describe('com o catálogo de verdade', () => {
  const comCatalogo = new PesquisarEspecies(new RepositorioDeEspeciesLocal());

  test('"mais fáceis primeiro" nunca põe uma espécie antes de outra mais fácil', async () => {
    const escala = (await comCatalogo.executar({ ordem: 'mais-faceis-primeiro' })).map((item) =>
      ordemDaDificuldade(item.nivelDeDificuldade),
    );
    expect(escala).toEqual([...escala].sort((a, b) => a - b));
  });

  test('dentro do nível a ordem alfabética do catálogo se mantém', async () => {
    const faceis = (await comCatalogo.executar({ ordem: 'mais-faceis-primeiro' }))
      .filter((item) => item.nivelDeDificuldade === 'facil')
      .map((item) => item.nomeComum);
    // Comparando como o repositório compara, e não com localeCompare: senão o teste falharia por outro motivo.
    const alfabetica = [...faceis].sort((a, b) => {
      const [x, y] = [normalizarTexto(a), normalizarTexto(b)];
      return x < y ? -1 : x > y ? 1 : 0;
    });
    expect(faceis).toEqual(alfabetica);
  });

  test('"Fáceis" devolve espécies, e nenhuma delas é média ou exigente', async () => {
    const faceis = await comCatalogo.executar({ filtro: 'somente-faceis' });
    expect(faceis.length).toBeGreaterThan(0);
    expect(faceis.every((item) => item.nivelDeDificuldade === 'facil')).toBe(true);
  });
});

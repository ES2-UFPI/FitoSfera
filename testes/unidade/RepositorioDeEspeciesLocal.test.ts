import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { RepositorioDeEspeciesLocal } from '@/infraestrutura/catalogo/RepositorioDeEspeciesLocal';
import { ESPECIES_DE_TESTE, especieDeTeste } from '../apoio/especiesDeTeste';

const lista: EspecieVegetal[] = [
  ...ESPECIES_DE_TESTE.filter((especie) => especie.id !== 'lavanda'),
  especieDeTeste({ id: 'ebano-de-teste', nomeComum: 'Ébano-de-teste', nomeCientifico: 'Diospyros ficticia', nomesAlternativos: [] }),
];
const repo = new RepositorioDeEspeciesLocal(lista);
const ids = (especies: readonly EspecieVegetal[]) => especies.map((e) => e.id);

test('listarTodas ordena por nome comum ignorando acentos', async () => {
  expect(ids(await repo.listarTodas())).toEqual([
    'alface',
    'ebano-de-teste',
    'espada-de-sao-jorge',
    'jiboia',
    'tomate',
  ]);
});

test('pesquisar casa nome comum sem acento e com hífen trocado por espaço', async () => {
  expect(ids(await repo.pesquisar('espada de sao jorge '))).toEqual(['espada-de-sao-jorge']);
});

test('pesquisar casa nome alternativo', async () => {
  expect(ids(await repo.pesquisar('POTHOS'))).toEqual(['jiboia']);
});

test('pesquisar casa nome científico', async () => {
  expect(ids(await repo.pesquisar('lycopersicum'))).toEqual(['tomate']);
});

test('termo vazio devolve todas em ordem', async () => {
  expect(ids(await repo.pesquisar('   '))).toEqual([
    'alface',
    'ebano-de-teste',
    'espada-de-sao-jorge',
    'jiboia',
    'tomate',
  ]);
});

test('termo sem par devolve lista vazia', async () => {
  expect(await repo.pesquisar('xyzw')).toEqual([]);
});

test('obterPorId acha a espécie e devolve null para id inexistente', async () => {
  expect((await repo.obterPorId('jiboia'))?.nomeComum).toBe('Jiboia');
  expect(await repo.obterPorId('nao-existe')).toBeNull();
});

test('o catálogo embutido fornece a média e os estágios da frutífera, sem exigir dados de quem não dá frutos', async () => {
  const catalogo = new RepositorioDeEspeciesLocal();
  expect(await catalogo.obterPorId('tomate')).toEqual(expect.objectContaining({
    frutifera: true,
    tempoMedioAteColheitaEmDias: 75,
    estagiosDeDesenvolvimento: expect.arrayContaining([{ nome: 'frutificação', duracaoEmDias: 42 }]),
  }));
  const alface = await catalogo.obterPorId('alface');
  expect(alface?.frutifera).toBe(false);
  expect(alface?.tempoMedioAteColheitaEmDias).toBeUndefined();
});

describe('o nível de dificuldade vem da conta, não do campo do catálogo', () => {
  // Sem `especies`, o repositório usa o catálogo embutido e as fichas de manejo de verdade.
  const catalogoReal = new RepositorioDeEspeciesLocal();

  test('o tomate sai exigente: rega 1 dia (2) + DLI 18 (2) + poda na ficha (1) = 5', async () => {
    const tomate = await catalogoReal.obterPorId('tomate');
    expect(tomate?.nivelDeDificuldade).toBe('dificil');
    expect(tomate?.exigencias?.exigeManejoEstrutural.presente).toBe(true);
  });

  test('o boldo, sem ficha, fica com o manejo valendo 0 e sai médio', async () => {
    const boldo = await catalogoReal.obterPorId('boldo');
    expect(boldo?.exigencias).toBeNull();
    expect(boldo?.nivelDeDificuldade).toBe('medio');
  });

  test('não há espécie exigente sem ficha: sem manejo o total para em 4 e o corte é 5', async () => {
    const todas = await catalogoReal.listarTodas();
    const exigentesSemFicha = todas.filter((e) => e.nivelDeDificuldade === 'dificil' && e.exigencias === null);
    expect(exigentesSemFicha).toEqual([]);
  });

  test('ignora o campo do JSON: a orquídea é curada como difícil e sai fácil pela conta', async () => {
    // Miss estrutural, documentado no classificador: base 0 de rega e luz, nem três fatos a tirariam de fácil.
    expect((await catalogoReal.obterPorId('orquidea'))?.nivelDeDificuldade).toBe('facil');
  });

  test('espécie com a própria ficha não consulta o arquivo do catálogo', async () => {
    const fonte = 'Fonte de teste';
    const comPraga = especieDeTeste(
      { id: 'tomate', nomeComum: 'Tomate', nomeCientifico: 'Solanum lycopersicum', nomesAlternativos: [] },
      {
        intervaloDeRegaEmDias: 1,
        exigencias: {
          exigeControleDePraga: { presente: true, fonte },
          morreComEncharcamento: { presente: true, fonte },
          exigeManejoEstrutural: { presente: true, fonte },
        },
      },
    );
    const especie = await new RepositorioDeEspeciesLocal([comPraga]).obterPorId('tomate');
    // 2 (rega) + 1 (DLI 12 da espécie de teste) + 3 (os três fatos) = 6.
    expect(especie?.nivelDeDificuldade).toBe('dificil');
    expect(especie?.exigencias?.exigeControleDePraga.presente).toBe(true);
  });
});

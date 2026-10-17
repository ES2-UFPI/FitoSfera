import { EspecieNaoEncontrada } from '@/aplicacao/casos-de-uso/AdicionarPlantaAoJardim';
import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { ApelidoInvalido } from '@/dominio/modelos/Planta';
import { criarContainerDeTeste, plantaDeTeste } from '../apoio/fakes';

test('ListarJardimVirtual devolve as plantas na ordem de cadastro, cada uma com a sua espécie', async () => {
  const { container } = criarContainerDeTeste({
    plantas: [
      plantaDeTeste({ id: 'p1', idEspecie: 'lavanda', apelido: 'Roxinha' }),
      plantaDeTeste({ id: 'p2', idEspecie: 'tomate', apelido: 'Tomatinho' }),
    ],
  });
  const jardim = await container.listarJardim.executar();
  expect(jardim.map((item) => [item.planta.apelido, item.especie?.nomeComum])).toEqual([
    ['Roxinha', 'Lavanda'],
    ['Tomatinho', 'Tomate'],
  ]);
});

test('planta cuja espécie não está no catálogo continua na lista com especie null', async () => {
  const { container } = criarContainerDeTeste({ plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'sumiu' })] });
  const jardim = await container.listarJardim.executar();
  expect(jardim).toHaveLength(1);
  expect(jardim[0].especie).toBeNull();
  expect(jardim[0].planta.id).toBe('p1');
});

test('ObterPlantaDoJardim devolve a planta com a espécie, ou null para id inexistente', async () => {
  const { container } = criarContainerDeTeste({ plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'jiboia' })] });
  expect((await container.obterPlanta.executar('p1'))?.especie?.nomeComum).toBe('Jiboia');
  expect(await container.obterPlanta.executar('p9')).toBeNull();
});

test('PesquisarEspecies apara o termo e devolve tudo quando vazio', async () => {
  const { container } = criarContainerDeTeste();
  expect((await container.pesquisarEspecies.executar('  tomate  ')).map((e) => e.id)).toEqual(['tomate']);
  expect(await container.pesquisarEspecies.executar('')).toHaveLength(5);
});

test('AdicionarPlantaAoJardim salva com o id do gerador e devolve a planta', async () => {
  const { container, plantas } = criarContainerDeTeste();
  const planta = await container.adicionarPlanta.executar({
    idEspecie: 'tomate',
    apelido: 'Tom',
    aparencia: APARENCIA_INICIAL,
  });
  expect(planta.id).toBe('p1');
  expect(plantas.salvas).toEqual([planta]);
});

test('espécie inexistente lança EspecieNaoEncontrada e não salva nada', async () => {
  const { container, plantas } = criarContainerDeTeste();
  await expect(
    container.adicionarPlanta.executar({ idEspecie: 'nao-existe', apelido: 'X', aparencia: APARENCIA_INICIAL }),
  ).rejects.toThrow(EspecieNaoEncontrada);
  expect(plantas.salvas).toEqual([]);
});

test('apelido inválido lança ApelidoInvalido e não salva nada', async () => {
  const { container, plantas } = criarContainerDeTeste();
  await expect(
    container.adicionarPlanta.executar({ idEspecie: 'tomate', apelido: '  ', aparencia: APARENCIA_INICIAL }),
  ).rejects.toThrow(ApelidoInvalido);
  expect(plantas.salvas).toEqual([]);
});

describe('status resumido de cada planta', () => {
  const agora = new Date(2026, 9, 17, 14, 0);
  const leitura = (parcial = {}) => ({
    umidadePercentual: 60,
    temperaturaCelsius: 24,
    luminosidadeLux: 12000,
    medidaEm: new Date(agora.getTime() - 10 * 60_000),
    ...parcial,
  });
  const statusDoJardim = async (opcoes: Parameters<typeof criarContainerDeTeste>[0]) =>
    (await criarContainerDeTeste({ agora, ...opcoes }).container.listarJardim.executar()).map((item) => item.status);

  test('sem sensor, toda planta vem como sem-dados', async () => {
    expect(await statusDoJardim({ plantas: [plantaDeTeste()], leitura: null })).toEqual(['sem-dados']);
  });

  test('leitura recente dentro da faixa da espécie vem ok; fora dela, atencao', async () => {
    expect(await statusDoJardim({ plantas: [plantaDeTeste()], leitura: leitura() })).toEqual(['ok']);
    expect(await statusDoJardim({ plantas: [plantaDeTeste()], leitura: leitura({ luminosidadeLux: 800 }) })).toEqual([
      'atencao',
    ]);
  });

  test('leitura velha vem sem-dados, nunca ok', async () => {
    const velha = leitura({ medidaEm: new Date(agora.getTime() - 31 * 60_000) });
    expect(await statusDoJardim({ plantas: [plantaDeTeste()], leitura: velha })).toEqual(['sem-dados']);
  });

  test('espécie que saiu do catálogo vem sem-dados mesmo com leitura', async () => {
    const plantas = [plantaDeTeste({ id: 'p1', idEspecie: 'jiboia' }), plantaDeTeste({ id: 'p2', idEspecie: 'sumiu' })];
    expect(await statusDoJardim({ plantas, leitura: leitura() })).toEqual(['ok', 'sem-dados']);
  });

  test('falha do sensor vira sem-dados sem derrubar a lista', async () => {
    expect(await statusDoJardim({ plantas: [plantaDeTeste()], leitura: 'falha' })).toEqual(['sem-dados']);
  });

  test('o detalhe traz o mesmo status da lista', async () => {
    const { container } = criarContainerDeTeste({ agora, plantas: [plantaDeTeste()], leitura: leitura() });
    expect((await container.obterPlanta.executar('p1'))?.status).toBe('ok');
  });
});

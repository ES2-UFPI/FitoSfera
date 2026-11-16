import {
  ColheitaInvalida,
  PedidoDeColheita,
  RegistrarColheita,
} from '@/aplicacao/casos-de-uso/RegistrarColheita';
import { GeradorSequencial, plantaDeTeste, RelogioParado, RepositorioDeColheitasEmMemoria, RepositorioDePlantasEmMemoria } from '../apoio/fakes';

/** Terça, 11/11/2026, às 15:30, no fuso do aparelho. */
const agora = new Date(2026, 10, 11, 15, 30);

function montar() {
  const colheitas = new RepositorioDeColheitasEmMemoria();
  const plantas = new RepositorioDePlantasEmMemoria([plantaDeTeste({ id: 'tomateiro', idEspecie: 'tomate' })]);
  const registrar = new RegistrarColheita(colheitas, plantas, new GeradorSequencial(), new RelogioParado(agora));
  return { colheitas, registrar };
}

const pedido = (extra: Partial<PedidoDeColheita> = {}): PedidoDeColheita => ({
  idPlanta: 'tomateiro',
  quantidade: 12,
  unidade: 'unidades',
  ...extra,
});

async function motivoDaRecusa(registrar: RegistrarColheita, extra: Partial<PedidoDeColheita>) {
  try {
    await registrar.executar(pedido(extra));
  } catch (falha) {
    if (falha instanceof ColheitaInvalida) return falha.motivo;
    throw falha;
  }
  throw new Error('a colheita deveria ter sido recusada');
}

test('grava uma colheita válida com id novo e a hora de agora, e devolve o registro', async () => {
  const { colheitas, registrar } = montar();

  const registro = await registrar.executar(pedido());

  expect(registro).toEqual({ id: 'p1', idPlanta: 'tomateiro', quantidade: 12, unidade: 'unidades', colhidaEm: agora });
  expect(colheitas.salvas).toEqual([registro]);
});

test('gramas aceitam fração', async () => {
  const { registrar } = montar();
  await expect(registrar.executar(pedido({ quantidade: 250.5, unidade: 'gramas' }))).resolves.toMatchObject({
    quantidade: 250.5,
    unidade: 'gramas',
  });
});

describe('quantidade', () => {
  test.each([
    ['vazia', null, 'quantidade-vazia'],
    ['zero', 0, 'quantidade-invalida'],
    ['negativa', -3, 'quantidade-invalida'],
    ['que não é número', Number.NaN, 'quantidade-invalida'],
    ['infinita', Number.POSITIVE_INFINITY, 'quantidade-invalida'],
  ])('%s é recusada e nada é gravado', async (_caso, quantidade, motivo) => {
    const { colheitas, registrar } = montar();
    expect(await motivoDaRecusa(registrar, { quantidade })).toBe(motivo);
    expect(colheitas.salvas).toEqual([]);
  });

  test('contando frutos, fração é recusada', async () => {
    const { registrar } = montar();
    expect(await motivoDaRecusa(registrar, { quantidade: 2.5, unidade: 'unidades' })).toBe('unidades-fracionadas');
  });
});

test('unidade fora da lista é recusada', async () => {
  const { colheitas, registrar } = montar();
  expect(await motivoDaRecusa(registrar, { unidade: 'caixas' })).toBe('unidade-invalida');
  expect(colheitas.salvas).toEqual([]);
});

describe('data', () => {
  test('hoje leva a hora de agora', async () => {
    const { registrar } = montar();
    const registro = await registrar.executar(pedido({ dia: { dia: 11, mes: 11, ano: 2026 } }));
    expect(registro.colhidaEm).toEqual(agora);
  });

  test('um dia anterior fica ao meio-dia daquele dia', async () => {
    const { registrar } = montar();
    const registro = await registrar.executar(pedido({ dia: { dia: 5, mes: 11, ano: 2026 } }));
    expect(registro.colhidaEm).toEqual(new Date(2026, 10, 5, 12, 0));
  });

  test.each([
    ['ilegível', 'ilegivel' as const],
    ['31 de fevereiro', { dia: 31, mes: 2, ano: 2026 }],
    ['mês 13', { dia: 1, mes: 13, ano: 2026 }],
    ['dia zero', { dia: 0, mes: 11, ano: 2026 }],
    ['ano com dois dígitos', { dia: 5, mes: 11, ano: 26 }],
  ])('%s é recusada como data inválida', async (_caso, dia) => {
    const { registrar } = montar();
    expect(await motivoDaRecusa(registrar, { dia })).toBe('data-invalida');
  });

  test('amanhã é recusado como data no futuro', async () => {
    const { registrar } = montar();
    expect(await motivoDaRecusa(registrar, { dia: { dia: 12, mes: 11, ano: 2026 } })).toBe('data-no-futuro');
  });

  test('o dia que o formulário mostra preenchido é hoje', () => {
    const { registrar } = montar();
    expect(registrar.hoje()).toEqual({ dia: 11, mes: 11, ano: 2026 });
  });
});

test('planta que não está no jardim é recusada, para não sobrar colheita órfã', async () => {
  const { colheitas, registrar } = montar();
  expect(await motivoDaRecusa(registrar, { idPlanta: 'sumiu' })).toBe('planta-inexistente');
  expect(colheitas.salvas).toEqual([]);
});

test('falha do armazenamento sobe como erro comum, não como recusa', async () => {
  const plantas = new RepositorioDePlantasEmMemoria([plantaDeTeste({ id: 'tomateiro' })]);
  const registrar = new RegistrarColheita(
    new RepositorioDeColheitasEmMemoria([], true),
    plantas,
    new GeradorSequencial(),
    new RelogioParado(agora),
  );
  await expect(registrar.executar(pedido())).rejects.toThrow('armazenamento indisponível');
  await expect(registrar.executar(pedido())).rejects.not.toBeInstanceOf(ColheitaInvalida);
});

describe('colher marca a planta como já produzindo', () => {
  test('uma planta que ainda não estava produzindo passa a estar, sem data de floração', async () => {
    const colheitas = new RepositorioDeColheitasEmMemoria();
    const plantas = new RepositorioDePlantasEmMemoria([plantaDeTeste({ id: 'tomateiro', idEspecie: 'tomate' })]);
    const registrar = new RegistrarColheita(colheitas, plantas, new GeradorSequencial(), new RelogioParado(agora));

    await registrar.executar(pedido());

    expect(await plantas.obterPorId('tomateiro')).toMatchObject({ colheitaIniciada: true, floracaoIniciadaEm: null });
  });

  test('a data de floração que a pessoa já informou fica como estava', async () => {
    const floracao = new Date(2026, 9, 1);
    const plantas = new RepositorioDePlantasEmMemoria([
      plantaDeTeste({ id: 'tomateiro', idEspecie: 'tomate', colheitaIniciada: true, floracaoIniciadaEm: floracao }),
    ]);
    const registrar = new RegistrarColheita(
      new RepositorioDeColheitasEmMemoria(),
      plantas,
      new GeradorSequencial(),
      new RelogioParado(agora),
    );

    await registrar.executar(pedido());

    expect(await plantas.obterPorId('tomateiro')).toMatchObject({ colheitaIniciada: true, floracaoIniciadaEm: floracao });
  });

  test('se não der para marcar a planta, a colheita continua registrada', async () => {
    const colheitas = new RepositorioDeColheitasEmMemoria();
    const plantas = new RepositorioDePlantasEmMemoria([plantaDeTeste({ id: 'tomateiro', idEspecie: 'tomate' })]);
    jest.spyOn(plantas, 'atualizar').mockRejectedValue(new Error('disco cheio'));
    const registrar = new RegistrarColheita(colheitas, plantas, new GeradorSequencial(), new RelogioParado(agora));

    await expect(registrar.executar(pedido())).resolves.toMatchObject({ idPlanta: 'tomateiro' });
    expect(colheitas.salvas).toHaveLength(1);
  });
});

describe('colheita antes do plantio', () => {
  function montarComPlantio(plantadaEm: Date | null) {
    const colheitas = new RepositorioDeColheitasEmMemoria();
    const plantas = new RepositorioDePlantasEmMemoria([plantaDeTeste({ id: 'tomateiro', idEspecie: 'tomate', plantadaEm })]);
    return { colheitas, registrar: new RegistrarColheita(colheitas, plantas, new GeradorSequencial(), new RelogioParado(agora)) };
  }

  test('um dia antes do plantio é recusado, sem gravar', async () => {
    const { colheitas, registrar } = montarComPlantio(new Date(2026, 8, 1));
    expect(await motivoDaRecusa(registrar, { dia: { dia: 31, mes: 8, ano: 2026 } })).toBe('data-antes-do-plantio');
    expect(colheitas.salvas).toEqual([]);
  });

  test('o próprio dia do plantio vale, mesmo com o plantio gravado com hora', async () => {
    const { registrar } = montarComPlantio(new Date(2026, 8, 1, 18, 30));
    await expect(registrar.executar(pedido({ dia: { dia: 1, mes: 9, ano: 2026 } }))).resolves.toBeTruthy();
  });

  test('sem data de plantio, qualquer dia passado vale', async () => {
    const { registrar } = montarComPlantio(null);
    await expect(registrar.executar(pedido({ dia: { dia: 1, mes: 1, ano: 2020 } }))).resolves.toBeTruthy();
  });
});

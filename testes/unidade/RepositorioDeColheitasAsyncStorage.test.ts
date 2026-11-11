import { RegistroDeColheita } from '@/dominio/modelos/RegistroDeColheita';
import { CHAVES } from '@/infraestrutura/persistencia/chaves';
import { RepositorioDeColheitasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeColheitasAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';

const inicio = new Date('2026-10-01T08:00:00.000Z').getTime();
/** A n-ésima colheita da planta, um dia depois da anterior. */
const colheita = (idPlanta: string, n: number, extra: Partial<RegistroDeColheita> = {}): RegistroDeColheita => ({
  id: `${idPlanta}-c${n}`,
  idPlanta,
  quantidade: n * 3,
  unidade: 'unidades',
  colhidaEm: new Date(inicio + n * 86_400_000),
  ...extra,
});

let armazenamento: ArmazenamentoEmMemoria;
let repo: RepositorioDeColheitasAsyncStorage;
beforeEach(() => {
  armazenamento = new ArmazenamentoEmMemoria();
  repo = new RepositorioDeColheitasAsyncStorage(armazenamento);
});

test('planta sem colheitas lista vazio, sem erro', async () => {
  await expect(repo.listarPorPlanta('p1')).resolves.toEqual([]);
});

test('devolve o registro gravado com planta, quantidade, unidade e data e hora', async () => {
  await repo.gravar(colheita('p1', 1, { quantidade: 250, unidade: 'gramas' }));

  expect(await repo.listarPorPlanta('p1')).toEqual([
    {
      id: 'p1-c1',
      idPlanta: 'p1',
      quantidade: 250,
      unidade: 'gramas',
      colhidaEm: new Date('2026-10-02T08:00:00.000Z'),
    },
  ]);
});

test('o registro continua disponível depois de fechar e reabrir o app', async () => {
  await repo.gravar(colheita('p1', 1));

  // Reabrir o app: um repositório novo sobre o mesmo armazenamento do aparelho.
  const depoisDeReabrir = new RepositorioDeColheitasAsyncStorage(armazenamento);

  expect((await depoisDeReabrir.listarPorPlanta('p1')).map((registro) => registro.id)).toEqual(['p1-c1']);
});

test('lista da colheita mais recente para a mais antiga, mesmo gravada fora de ordem', async () => {
  await repo.gravar(colheita('p1', 1));
  await repo.gravar(colheita('p1', 3));
  await repo.gravar(colheita('p1', 2));

  expect((await repo.listarPorPlanta('p1')).map((registro) => registro.id)).toEqual(['p1-c3', 'p1-c2', 'p1-c1']);
});

test('agrupa por planta: cada uma tem a sua chave e não enxerga as colheitas da outra', async () => {
  await repo.gravar(colheita('p1', 1));
  await repo.gravar(colheita('p2', 1));

  expect([...armazenamento.valores.keys()].sort()).toEqual([
    'fitosfera:v4:colheitas:p1',
    'fitosfera:v4:colheitas:p2',
  ]);
  expect((await repo.listarPorPlanta('p2')).map((registro) => registro.id)).toEqual(['p2-c1']);
});

test('não descarta colheitas antigas: o histórico e o rendimento precisam de todas', async () => {
  for (let n = 1; n <= 120; n++) await repo.gravar(colheita('p1', n));
  expect(await repo.listarPorPlanta('p1')).toHaveLength(120);
});

test('gravar de novo o mesmo id substitui o registro, sem duplicar a colheita', async () => {
  await repo.gravar(colheita('p1', 1, { quantidade: 2 }));
  await repo.gravar(colheita('p1', 1, { quantidade: 5 }));

  expect((await repo.listarPorPlanta('p1')).map((registro) => registro.quantidade)).toEqual([5]);
});

test('grava a data em ISO e não repete o id da planta, que já está na chave', async () => {
  await repo.gravar(colheita('p1', 1));

  expect(JSON.parse(armazenamento.valores.get(CHAVES.colheitasDaPlanta('p1')) ?? 'null')).toEqual([
    { id: 'p1-c1', quantidade: 3, unidade: 'unidades', colhidaEm: '2026-10-02T08:00:00.000Z' },
  ]);
});

test('apagar as colheitas de uma planta remove a chave e a cópia ilegível, sem tocar nas outras', async () => {
  await repo.gravar(colheita('p1', 1));
  await repo.gravar(colheita('p2', 1));
  await armazenamento.setItem(CHAVES.colheitasIlegiveisDaPlanta('p1'), 'lixo');

  await repo.apagarDaPlanta('p1');

  expect([...armazenamento.valores.keys()]).toEqual([CHAVES.colheitasDaPlanta('p2')]);
  expect(await repo.listarPorPlanta('p1')).toEqual([]);
});

describe('dado corrompido ou ilegível', () => {
  test('chave que não é JSON lista vazio e é copiada para :ilegivel antes de ser sobrescrita', async () => {
    await armazenamento.setItem(CHAVES.colheitasDaPlanta('p1'), '{quebrado');

    expect(await repo.listarPorPlanta('p1')).toEqual([]);
    await repo.gravar(colheita('p1', 1));

    expect(armazenamento.valores.get(CHAVES.colheitasIlegiveisDaPlanta('p1'))).toBe('{quebrado');
    expect(await repo.listarPorPlanta('p1')).toHaveLength(1);
  });

  test('JSON que não é lista também conta como ilegível', async () => {
    await armazenamento.setItem(CHAVES.colheitasDaPlanta('p1'), '{"id":"x"}');
    expect(await repo.listarPorPlanta('p1')).toEqual([]);
  });

  test('registros inválidos ficam de fora, e os válidos continuam', async () => {
    await armazenamento.setItem(
      CHAVES.colheitasDaPlanta('p1'),
      JSON.stringify([
        { id: 'ok', quantidade: 4, unidade: 'unidades', colhidaEm: '2026-10-02T08:00:00.000Z' },
        { id: 'zero', quantidade: 0, unidade: 'unidades', colhidaEm: '2026-10-02T08:00:00.000Z' },
        { id: 'negativa', quantidade: -3, unidade: 'gramas', colhidaEm: '2026-10-02T08:00:00.000Z' },
        { id: 'texto', quantidade: '4', unidade: 'gramas', colhidaEm: '2026-10-02T08:00:00.000Z' },
        { id: 'unidade', quantidade: 4, unidade: 'caixas', colhidaEm: '2026-10-02T08:00:00.000Z' },
        { id: 'data', quantidade: 4, unidade: 'gramas', colhidaEm: 'ontem' },
        { quantidade: 4, unidade: 'gramas', colhidaEm: '2026-10-02T08:00:00.000Z' },
        null,
      ]),
    );

    expect((await repo.listarPorPlanta('p1')).map((registro) => registro.id)).toEqual(['ok']);
  });
});

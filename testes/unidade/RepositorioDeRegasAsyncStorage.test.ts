import { LIMITE_DE_REGAS_POR_PLANTA, Rega } from '@/dominio/modelos/Rega';
import { RepositorioDeRegasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeRegasAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';

const inicio = new Date('2026-10-01T08:00:00.000Z').getTime();
/** A n-ésima rega da planta, um dia depois da anterior. */
const rega = (idPlanta: string, n: number): Rega => ({
  id: `${idPlanta}-r${n}`,
  idPlanta,
  regadaEm: new Date(inicio + n * 86_400_000),
});

let armazenamento: ArmazenamentoEmMemoria;
let repo: RepositorioDeRegasAsyncStorage;
beforeEach(() => {
  armazenamento = new ArmazenamentoEmMemoria();
  repo = new RepositorioDeRegasAsyncStorage(armazenamento);
});

test('planta sem regas lista vazio', async () => {
  expect(await repo.listarPorPlanta('p1')).toEqual([]);
});

test('lista as regas da planta da mais recente para a mais antiga', async () => {
  await repo.gravar(rega('p1', 1));
  await repo.gravar(rega('p1', 3));
  await repo.gravar(rega('p1', 2));
  expect((await repo.listarPorPlanta('p1')).map((r) => r.id)).toEqual(['p1-r3', 'p1-r2', 'p1-r1']);
});

test('cada planta tem a sua chave, e uma não enxerga as regas da outra', async () => {
  await repo.gravar(rega('p1', 1));
  await repo.gravar(rega('p2', 1));
  expect([...armazenamento.valores.keys()].sort()).toEqual(['fitosfera:v2:regas:p1', 'fitosfera:v2:regas:p2']);
  expect((await repo.listarPorPlanta('p2')).map((r) => r.id)).toEqual(['p2-r1']);
});

test('grava a data em ISO e não repete o id da planta, que já está na chave', async () => {
  await repo.gravar(rega('p1', 1));
  expect(JSON.parse(armazenamento.valores.get('fitosfera:v2:regas:p1') ?? 'null')).toEqual([
    { id: 'p1-r1', regadaEm: '2026-10-02T08:00:00.000Z' },
  ]);
});

describe(`retenção de ${LIMITE_DE_REGAS_POR_PLANTA} regas por planta`, () => {
  test('o limite é 50', () => {
    expect(LIMITE_DE_REGAS_POR_PLANTA).toBe(50);
  });

  test('gravar além do limite descarta as regas mais antigas, nunca as recentes', async () => {
    for (let n = 1; n <= LIMITE_DE_REGAS_POR_PLANTA + 5; n++) await repo.gravar(rega('p1', n));
    const ids = (await repo.listarPorPlanta('p1')).map((r) => r.id);
    expect(ids).toHaveLength(LIMITE_DE_REGAS_POR_PLANTA);
    expect(ids[0]).toBe('p1-r55');
    expect(ids[ids.length - 1]).toBe('p1-r6');
    expect(ids).not.toContain('p1-r5');
  });

  test('uma rega registrada com atraso entra na ordem certa e o descarte continua sendo a mais antiga', async () => {
    for (let n = 2; n <= LIMITE_DE_REGAS_POR_PLANTA + 1; n++) await repo.gravar(rega('p1', n));
    await repo.gravar(rega('p1', 30));
    await repo.gravar({ ...rega('p1', 0), id: 'atrasada-demais' });
    const ids = (await repo.listarPorPlanta('p1')).map((r) => r.id);
    expect(ids).toHaveLength(LIMITE_DE_REGAS_POR_PLANTA);
    expect(ids).toContain('p1-r51');
    expect(ids).not.toContain('atrasada-demais');
    expect(ids).not.toContain('p1-r2');
  });

  test('o limite de uma planta não poda as regas de outra', async () => {
    await repo.gravar(rega('p2', 1));
    for (let n = 1; n <= LIMITE_DE_REGAS_POR_PLANTA + 1; n++) await repo.gravar(rega('p1', n));
    expect(await repo.listarPorPlanta('p2')).toHaveLength(1);
  });
});

test('apagarDaPlanta remove a chave da planta e mantém as das outras', async () => {
  await repo.gravar(rega('p1', 1));
  await repo.gravar(rega('p2', 1));
  await repo.apagarDaPlanta('p1');
  expect(armazenamento.valores.has('fitosfera:v2:regas:p1')).toBe(false);
  expect(await repo.listarPorPlanta('p1')).toEqual([]);
  expect(await repo.listarPorPlanta('p2')).toHaveLength(1);
});

describe('dado corrompido', () => {
  test('chave ilegível lista vazio e, na próxima gravação, ganha uma cópia de segurança', async () => {
    await armazenamento.setItem('fitosfera:v2:regas:p1', '{quebrado');
    expect(await repo.listarPorPlanta('p1')).toEqual([]);
    await repo.gravar(rega('p1', 1));
    expect(armazenamento.valores.get('fitosfera:v2:regas:p1:ilegivel')).toBe('{quebrado');
    expect((await repo.listarPorPlanta('p1')).map((r) => r.id)).toEqual(['p1-r1']);
  });

  test('um registro ruim no meio não esconde os bons', async () => {
    await armazenamento.setItem(
      'fitosfera:v2:regas:p1',
      JSON.stringify([{ id: 'boa', regadaEm: '2026-10-02T08:00:00.000Z' }, { id: 'sem-data' }, 'lixo']),
    );
    expect((await repo.listarPorPlanta('p1')).map((r) => r.id)).toEqual(['boa']);
  });

  test('apagarDaPlanta também leva a cópia de segurança', async () => {
    await armazenamento.setItem('fitosfera:v2:regas:p1', '{quebrado');
    await repo.gravar(rega('p1', 1));
    await repo.apagarDaPlanta('p1');
    expect(armazenamento.valores.size).toBe(0);
  });
});

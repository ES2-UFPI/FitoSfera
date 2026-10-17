import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { Planta } from '@/dominio/modelos/Planta';
import { RepositorioDePlantasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDePlantasAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';

const planta = (id: string, apelido: string) =>
  Planta.criar({ id, idEspecie: 'tomate', apelido, aparencia: APARENCIA_INICIAL });

let armazenamento: ArmazenamentoEmMemoria;
let repo: RepositorioDePlantasAsyncStorage;
beforeEach(() => {
  armazenamento = new ArmazenamentoEmMemoria();
  repo = new RepositorioDePlantasAsyncStorage(armazenamento);
});

test('começa vazio', async () => {
  expect(await repo.listar()).toEqual([]);
});

test('lista na ordem de cadastro e grava um array JSON na chave fitosfera:v2:plantas', async () => {
  await repo.adicionar(planta('p1', 'Primeira'));
  await repo.adicionar(planta('p2', 'Segunda'));
  expect((await repo.listar()).map((p) => p.apelido)).toEqual(['Primeira', 'Segunda']);
  const gravado = JSON.parse(armazenamento.valores.get('fitosfera:v2:plantas') ?? 'null');
  expect(gravado.map((r: { id: string }) => r.id)).toEqual(['p1', 'p2']);
});

test('obterPorId acha a planta certa e devolve null para id inexistente', async () => {
  await repo.adicionar(planta('p1', 'Primeira'));
  await repo.adicionar(planta('p2', 'Segunda'));
  expect((await repo.obterPorId('p2'))?.apelido).toBe('Segunda');
  expect(await repo.obterPorId('p9')).toBeNull();
});

test('JSON corrompido na chave não derruba: listar devolve []', async () => {
  await armazenamento.setItem('fitosfera:v2:plantas', '{quebrado');
  expect(await repo.listar()).toEqual([]);
});

test('um registro ruim no meio não esconde os bons', async () => {
  const valido = { id: 'p7', idEspecie: 'tomate', apelido: 'Boa', aparencia: APARENCIA_INICIAL };
  await armazenamento.setItem('fitosfera:v2:plantas', JSON.stringify([{ id: 'x' }, valido]));
  expect((await repo.listar()).map((p) => p.id)).toEqual(['p7']);
});

// Ignorar na leitura não pode virar apagar na próxima gravação.
const gravado = () => JSON.parse(armazenamento.valores.get('fitosfera:v2:plantas') ?? 'null');

test('adicionar mantém no armazenamento o registro que não deu para ler', async () => {
  await armazenamento.setItem('fitosfera:v2:plantas', JSON.stringify([{ id: 'x' }]));
  await repo.adicionar(planta('p1', 'Nova'));
  expect(gravado()).toEqual([{ id: 'x' }, expect.objectContaining({ id: 'p1', apelido: 'Nova' })]);
});

test('adicionar não regrava a aparência de um registro antigo com id desconhecido', async () => {
  const antigo = {
    id: 'p0',
    idEspecie: 'tomate',
    apelido: 'Antigo',
    aparencia: { forma: 'bonsai', folhagem: 'roxo', destaque: 'azul', vaso: 'creme' },
  };
  await armazenamento.setItem('fitosfera:v2:plantas', JSON.stringify([antigo]));
  await repo.adicionar(planta('p1', 'Nova'));
  expect(gravado()[0]).toEqual(antigo);
});

test('adicionar guarda uma cópia do conteúdo ilegível antes de sobrescrever', async () => {
  await armazenamento.setItem('fitosfera:v2:plantas', '{quebrado');
  await repo.adicionar(planta('p1', 'Nova'));
  expect(armazenamento.valores.get('fitosfera:v2:plantas:ilegivel')).toBe('{quebrado');
  expect(gravado().map((r: { id: string }) => r.id)).toEqual(['p1']);
});

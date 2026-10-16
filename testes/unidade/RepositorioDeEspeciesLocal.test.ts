import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { RepositorioDeEspeciesLocal } from '@/infraestrutura/catalogo/RepositorioDeEspeciesLocal';

const lista: EspecieVegetal[] = [
  { id: 'tomate', nomeComum: 'Tomate', nomeCientifico: 'Solanum lycopersicum', nomesAlternativos: ['Tomateiro'] },
  { id: 'jiboia', nomeComum: 'Jiboia', nomeCientifico: 'Epipremnum aureum', nomesAlternativos: ['Pothos'] },
  {
    id: 'espada-de-sao-jorge',
    nomeComum: 'Espada-de-são-jorge',
    nomeCientifico: 'Dracaena trifasciata',
    nomesAlternativos: ['Sansevieria'],
  },
  { id: 'alface', nomeComum: 'Alface', nomeCientifico: 'Lactuca sativa', nomesAlternativos: [] },
  { id: 'ebano-de-teste', nomeComum: 'Ébano-de-teste', nomeCientifico: 'Diospyros ficticia', nomesAlternativos: [] },
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

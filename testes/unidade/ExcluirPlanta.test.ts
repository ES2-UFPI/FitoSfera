import { ExcluirPlanta } from '@/aplicacao/casos-de-uso/ExcluirPlanta';
import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { Planta } from '@/dominio/modelos/Planta';
import { RepositorioDePlantasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDePlantasAsyncStorage';
import { RepositorioDeRegasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeRegasAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';

const planta = (id: string) => Planta.criar({ id, idEspecie: 'tomate', apelido: `Planta ${id}`, aparencia: APARENCIA_INICIAL });
const rega = (idPlanta: string, n: number) => ({
  id: `${idPlanta}-r${n}`,
  idPlanta,
  regadaEm: new Date(Date.UTC(2026, 9, n)),
});

function montar() {
  const armazenamento = new ArmazenamentoEmMemoria();
  const plantas = new RepositorioDePlantasAsyncStorage(armazenamento);
  const regas = new RepositorioDeRegasAsyncStorage(armazenamento);
  return { armazenamento, plantas, regas, excluir: new ExcluirPlanta(plantas, regas) };
}

test('excluir uma planta não deixa regas órfãs no armazenamento', async () => {
  const { armazenamento, plantas, regas, excluir } = montar();
  await plantas.adicionar(planta('p1'));
  await plantas.adicionar(planta('p2'));
  await regas.gravar(rega('p1', 1));
  await regas.gravar(rega('p1', 2));
  await regas.gravar(rega('p2', 1));

  await excluir.executar('p1');

  expect((await plantas.listar()).map((p) => p.id)).toEqual(['p2']);
  expect([...armazenamento.valores.keys()].filter((chave) => chave.includes('regas'))).toEqual([
    'fitosfera:v2:regas:p2',
  ]);
});

test('as regas saem antes da planta: se a remoção da planta falhar, não sobra rega sem dona', async () => {
  const { plantas, regas } = montar();
  await plantas.adicionar(planta('p1'));
  await regas.gravar(rega('p1', 1));
  const ordem: string[] = [];
  const excluir = new ExcluirPlanta(
    {
      ...plantas,
      listar: () => plantas.listar(),
      obterPorId: (id) => plantas.obterPorId(id),
      adicionar: (p) => plantas.adicionar(p),
      remover: async () => {
        ordem.push('planta');
        throw new Error('disco cheio');
      },
    },
    {
      gravar: (r) => regas.gravar(r),
      listarPorPlanta: (id) => regas.listarPorPlanta(id),
      apagarDaPlanta: async (id) => {
        ordem.push('regas');
        await regas.apagarDaPlanta(id);
      },
    },
  );

  await expect(excluir.executar('p1')).rejects.toThrow('disco cheio');
  expect(ordem).toEqual(['regas', 'planta']);
  expect(await regas.listarPorPlanta('p1')).toEqual([]);
});

test('excluir id inexistente não mexe nas outras plantas', async () => {
  const { plantas, excluir } = montar();
  await plantas.adicionar(planta('p1'));
  await excluir.executar('p9');
  expect((await plantas.listar()).map((p) => p.id)).toEqual(['p1']);
});

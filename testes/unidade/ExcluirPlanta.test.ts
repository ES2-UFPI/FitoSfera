import { ExcluirPlanta } from '@/aplicacao/casos-de-uso/ExcluirPlanta';
import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { Planta } from '@/dominio/modelos/Planta';
import { RepositorioDePlantasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDePlantasAsyncStorage';
import { RepositorioDeRegasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeRegasAsyncStorage';
import { RegistroDeExclusoesPendentesAsyncStorage } from '@/infraestrutura/persistencia/RegistroDeExclusoesPendentesAsyncStorage';
import { CHAVES } from '@/infraestrutura/persistencia/chaves';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';
import { NotificadorFalso } from '../apoio/fakes';

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
  const pendentes = new RegistroDeExclusoesPendentesAsyncStorage(armazenamento);
  return { armazenamento, plantas, regas, pendentes, excluir: new ExcluirPlanta(plantas, regas, pendentes, new NotificadorFalso()) };
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

test('cancela os avisos da planta antes de removê-la, sem tocar nos avisos das outras', async () => {
  const armazenamento = new ArmazenamentoEmMemoria();
  const plantas = new RepositorioDePlantasAsyncStorage(armazenamento);
  const regas = new RepositorioDeRegasAsyncStorage(armazenamento);
  const pendentes = new RegistroDeExclusoesPendentesAsyncStorage(armazenamento);
  const notificador = new NotificadorFalso();
  await plantas.adicionar(planta('p1'));
  await plantas.adicionar(planta('p2'));
  const ordem: string[] = [];
  const excluir = new ExcluirPlanta(
    {
      listar: () => plantas.listar(),
      obterPorId: (id) => plantas.obterPorId(id),
      existe: (id) => plantas.existe(id),
      adicionar: (item) => plantas.adicionar(item),
      atualizar: (item) => plantas.atualizar(item),
      remover: async (id) => { ordem.push('remover'); await plantas.remover(id); },
    },
    regas,
    pendentes,
    { ...notificador, cancelarDaPlanta: async (id) => { ordem.push('cancelar'); await notificador.cancelarDaPlanta(id); } },
  );

  await excluir.executar('p1');

  expect(ordem).toEqual(['cancelar', 'remover']);
  expect(notificador.canceladas).toEqual(['p1']);
  expect((await plantas.listar()).map((item) => item.id)).toEqual(['p2']);
});

test('não remove a planta se não conseguir cancelar seus avisos pendentes', async () => {
  const { plantas, regas, pendentes } = montar();
  await plantas.adicionar(planta('p1'));
  const notificador = new NotificadorFalso();
  notificador.falharAoCancelar = true;
  const excluir = new ExcluirPlanta(plantas, regas, pendentes, notificador);

  await expect(excluir.executar('p1')).rejects.toThrow('não foi possível cancelar');

  expect(await plantas.obterPorId('p1')).not.toBeNull();
  expect(await pendentes.listar()).toEqual([]);
});

test('se a remoção da planta falhar, mantém as regas para não perder o histórico', async () => {
  const { plantas, regas, pendentes } = montar();
  await plantas.adicionar(planta('p1'));
  await regas.gravar(rega('p1', 1));
  const ordem: string[] = [];
  const excluir = new ExcluirPlanta(
    {
      ...plantas,
      listar: () => plantas.listar(),
      obterPorId: (id) => plantas.obterPorId(id),
      existe: (id) => plantas.existe(id),
      adicionar: (p) => plantas.adicionar(p),
      atualizar: (p) => plantas.atualizar(p),
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
    pendentes,
    new NotificadorFalso(),
  );

  await expect(excluir.executar('p1')).rejects.toThrow('disco cheio');
  expect(ordem).toEqual(['planta']);
  expect(await plantas.obterPorId('p1')).not.toBeNull();
  expect(await regas.listarPorPlanta('p1')).toHaveLength(1);
  expect(await pendentes.listar()).toEqual([]);
});

test('excluir id inexistente não mexe nas outras plantas', async () => {
  const { plantas, excluir } = montar();
  await plantas.adicionar(planta('p1'));
  await excluir.executar('p9');
  expect((await plantas.listar()).map((p) => p.id)).toEqual(['p1']);
});

test('recuperação apaga regas pendentes só quando confirma que a planta sumiu, e não toca no cache do jardim', async () => {
  const { armazenamento, plantas, regas, pendentes, excluir } = montar();
  await plantas.adicionar(planta('p1'));
  await regas.gravar(rega('p1', 1));
  await armazenamento.setItem(CHAVES.leituraDoJardim('jardim-principal'), JSON.stringify({ temperaturaCelsius: 24 }));

  await pendentes.marcar('p1');
  await excluir.recuperarPendentes();
  expect(await regas.listarPorPlanta('p1')).toHaveLength(1);
  expect(await pendentes.listar()).toEqual([]);

  await pendentes.marcar('p1');
  await plantas.remover('p1');
  await excluir.recuperarPendentes();
  expect(await regas.listarPorPlanta('p1')).toEqual([]);
  expect(await armazenamento.getItem(CHAVES.leituraDoJardim('jardim-principal'))).not.toBeNull();
  expect(await pendentes.listar()).toEqual([]);
});

test('falha ao apagar regas fica marcada e é concluída na recuperação seguinte', async () => {
  const { plantas, regas, pendentes } = montar();
  await plantas.adicionar(planta('p1'));
  await regas.gravar(rega('p1', 1));
  let falhar = true;
  const regasInstaveis = {
    gravar: (item: ReturnType<typeof rega>) => regas.gravar(item),
    listarPorPlanta: (id: string) => regas.listarPorPlanta(id),
    apagarDaPlanta: async (id: string) => {
      if (falhar) { falhar = false; throw new Error('armazenamento indisponível'); }
      await regas.apagarDaPlanta(id);
    },
  };
  const excluir = new ExcluirPlanta(plantas, regasInstaveis, pendentes, new NotificadorFalso());

  await expect(excluir.executar('p1')).rejects.toThrow('armazenamento indisponível');
  expect(await plantas.existe('p1')).toBe(false);
  expect(await pendentes.listar()).toEqual(['p1']);

  await excluir.recuperarPendentes();
  expect(await regas.listarPorPlanta('p1')).toEqual([]);
  expect(await pendentes.listar()).toEqual([]);
});

test('dado ilegível na lista de plantas não faz a recuperação apagar as regas', async () => {
  const { armazenamento, plantas, regas, pendentes, excluir } = montar();
  await plantas.adicionar(planta('p1'));
  await regas.gravar(rega('p1', 1));
  await pendentes.marcar('p1');
  await armazenamento.setItem(CHAVES.plantas, '{dados ilegíveis');

  await expect(excluir.recuperarPendentes()).rejects.toThrow('Não foi possível verificar se a planta ainda existe.');
  expect(await regas.listarPorPlanta('p1')).toHaveLength(1);
  expect(await pendentes.listar()).toEqual(['p1']);
});

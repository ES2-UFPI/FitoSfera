import { CadastrarPlanta, EspecieNaoEncontrada } from '@/aplicacao/casos-de-uso/CadastrarPlanta';
import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { ApelidoInvalido } from '@/dominio/modelos/Planta';
import { RepositorioDeEspeciesLocal } from '@/infraestrutura/catalogo/RepositorioDeEspeciesLocal';
import { ArmazenamentoComMigracao } from '@/infraestrutura/persistencia/ArmazenamentoComMigracao';
import { MigradorDoArmazenamento } from '@/infraestrutura/persistencia/MigradorDoArmazenamento';
import { RepositorioDePlantasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDePlantasAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';
import { ESPECIES_DE_TESTE } from '../apoio/especiesDeTeste';
import { GeradorSequencial, RelogioParado, RepositorioDePlantasEmMemoria } from '../apoio/fakes';

const agora = new Date('2026-10-17T14:00:00.000Z');
const pedido = (apelido = 'Tomatinho') => ({ idEspecie: 'tomate', apelido, aparencia: APARENCIA_INICIAL });

function montar() {
  const plantas = new RepositorioDePlantasEmMemoria();
  const cadastrar = new CadastrarPlanta(
    plantas,
    new RepositorioDeEspeciesLocal(ESPECIES_DE_TESTE),
    new GeradorSequencial(),
    new RelogioParado(agora),
  );
  return { plantas, cadastrar };
}

test('cadastra a espécie escolhida no jardim, com identificador e data de cadastro', async () => {
  const { plantas, cadastrar } = montar();
  const planta = await cadastrar.executar(pedido());

  expect(planta).toMatchObject({ id: 'p1', idEspecie: 'tomate', apelido: 'Tomatinho' });
  expect(planta.cadastradaEm).toEqual(agora);
  expect(await plantas.listar()).toEqual([planta]);
});

test('cadastrar a mesma espécie duas vezes cria duas plantas distintas', async () => {
  const { plantas, cadastrar } = montar();
  const primeira = await cadastrar.executar(pedido());
  const segunda = await cadastrar.executar(pedido());

  expect(primeira.id).not.toBe(segunda.id);
  expect((await plantas.listar()).map((planta) => [planta.id, planta.idEspecie])).toEqual([
    ['p1', 'tomate'],
    ['p2', 'tomate'],
  ]);
});

test('espécie fora do catálogo lança EspecieNaoEncontrada e não grava nada', async () => {
  const { plantas, cadastrar } = montar();
  await expect(cadastrar.executar({ ...pedido(), idEspecie: 'nao-existe' })).rejects.toThrow(EspecieNaoEncontrada);
  expect(await plantas.listar()).toEqual([]);
});

test('apelido inválido lança ApelidoInvalido e não grava nada', async () => {
  const { plantas, cadastrar } = montar();
  await expect(cadastrar.executar(pedido('   '))).rejects.toThrow(ApelidoInvalido);
  expect(await plantas.listar()).toEqual([]);
});

test('a planta continua no jardim depois de fechar e reabrir o app', async () => {
  // O AsyncStorage sobrevive ao app; cada abertura monta repositório e migrador novos sobre ele.
  const aparelho = new ArmazenamentoEmMemoria();
  const abrirApp = () =>
    new RepositorioDePlantasAsyncStorage(new ArmazenamentoComMigracao(aparelho, new MigradorDoArmazenamento(aparelho)));
  const especies = new RepositorioDeEspeciesLocal(ESPECIES_DE_TESTE);

  const primeiraAbertura = new CadastrarPlanta(abrirApp(), especies, new GeradorSequencial(), new RelogioParado(agora));
  await primeiraAbertura.executar(pedido('Tomatinho'));
  await primeiraAbertura.executar(pedido('Tomatão'));

  const jardimReaberto = await abrirApp().listar();
  expect(jardimReaberto.map((planta) => [planta.id, planta.apelido, planta.cadastradaEm])).toEqual([
    ['p1', 'Tomatinho', agora],
    ['p2', 'Tomatão', agora],
  ]);
});

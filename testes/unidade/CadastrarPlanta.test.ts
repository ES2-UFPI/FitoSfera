import { CadastrarPlanta, EspecieNaoEncontrada } from '@/aplicacao/casos-de-uso/CadastrarPlanta';
import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { ApelidoInvalido } from '@/dominio/modelos/Planta';
import { RepositorioDeEspeciesLocal } from '@/infraestrutura/catalogo/RepositorioDeEspeciesLocal';
import { ArmazenamentoComMigracao } from '@/infraestrutura/persistencia/ArmazenamentoComMigracao';
import { MigradorDoArmazenamento } from '@/infraestrutura/persistencia/MigradorDoArmazenamento';
import { RepositorioDePlantasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDePlantasAsyncStorage';
import { ListarJardimVirtual } from '@/aplicacao/casos-de-uso/ListarJardimVirtual';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';
import { ESPECIES_DE_TESTE, FAIXAS_DE_TESTE } from '../apoio/especiesDeTeste';
import { SensorFixo, GeradorSequencial, RelogioParado, RepositorioDePlantasEmMemoria } from '../apoio/fakes';

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

test('cadastro em outro jardim mantém a associação após reabrir o armazenamento', async () => {
  const aparelho = new ArmazenamentoEmMemoria();
  const plantas = new RepositorioDePlantasAsyncStorage(aparelho);
  const cadastrar = new CadastrarPlanta(plantas, new RepositorioDeEspeciesLocal(ESPECIES_DE_TESTE),
    new GeradorSequencial(), new RelogioParado(agora));
  await cadastrar.executar({ ...pedido(), idJardim: 'sala' });
  expect((await new RepositorioDePlantasAsyncStorage(aparelho).listar())[0].idJardim).toBe('sala');
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

describe('faixas recomendadas', () => {
  const tomateDoCatalogo = ESPECIES_DE_TESTE.find((especie) => especie.id === 'tomate') as EspecieVegetal;

  test('a planta cadastrada guarda uma cópia das faixas da espécie, sem a fonte', async () => {
    const { cadastrar } = montar();
    expect((await cadastrar.executar(pedido())).faixasRecomendadas).toEqual(FAIXAS_DE_TESTE);
  });

  test('alterar o catálogo depois não altera plantas já cadastradas', async () => {
    const aparelho = new ArmazenamentoEmMemoria();
    const abrirApp = () =>
      new RepositorioDePlantasAsyncStorage(new ArmazenamentoComMigracao(aparelho, new MigradorDoArmazenamento(aparelho)));
    await new CadastrarPlanta(
      abrirApp(),
      new RepositorioDeEspeciesLocal(ESPECIES_DE_TESTE),
      new GeradorSequencial(),
      new RelogioParado(agora),
    ).executar(pedido());

    // Uma versão nova do app passa a pedir muito mais luz para o tomate.
    const fonte = 'Catálogo revisado';
    const tomateRevisado: EspecieVegetal = {
      ...tomateDoCatalogo,
      faixasIdeais: {
        umidadeDoAr: { minimo: 60, maximo: 80, fonte },
        temperatura: { minimo: 22, maximo: 30, fonte },
        luminosidade: { minimo: 30000, maximo: 90000, fonte },
      },
    };
    const leitura = { umidadePercentual: 50, temperaturaCelsius: 20, luminosidadeLux: 12000, medidaEm: agora };
    const jardim = await new ListarJardimVirtual(
      abrirApp(),
      new RepositorioDeEspeciesLocal([tomateRevisado]),
      new SensorFixo(leitura),
      new RelogioParado(agora),
    ).executar();

    expect(jardim[0].planta.faixasRecomendadas).toEqual(FAIXAS_DE_TESTE);
    // A leitura está dentro das faixas guardadas e fora das novas: vale a da planta.
    expect(jardim[0].status).toBe('ok');
  });

  test('espécie sem faixa no catálogo não impede o cadastro', async () => {
    const semFaixa: EspecieVegetal = { ...tomateDoCatalogo, faixasIdeais: null };
    const plantas = new RepositorioDePlantasEmMemoria();
    const cadastrar = new CadastrarPlanta(
      plantas,
      new RepositorioDeEspeciesLocal([semFaixa]),
      new GeradorSequencial(),
      new RelogioParado(agora),
    );

    const planta = await cadastrar.executar(pedido());
    expect(planta.faixasRecomendadas).toBeNull();
    expect(await plantas.listar()).toEqual([planta]);
  });
});

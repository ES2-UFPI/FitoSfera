import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { copiarFaixas } from '@/dominio/modelos/FaixaRecomendada';
import { Planta } from '@/dominio/modelos/Planta';
import { RepositorioDeEspeciesLocal } from '@/infraestrutura/catalogo/RepositorioDeEspeciesLocal';
import { ArmazenamentoChaveValor } from '@/infraestrutura/persistencia/ArmazenamentoChaveValor';
import { ArmazenamentoComMigracao } from '@/infraestrutura/persistencia/ArmazenamentoComMigracao';
import { MigradorDoArmazenamento } from '@/infraestrutura/persistencia/MigradorDoArmazenamento';
import { criarMigracaoParaVersao2, Migracao } from '@/infraestrutura/persistencia/migracoes';
import { RepositorioDePlantasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDePlantasAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';
import { ESPECIES_DE_TESTE, FAIXAS_DE_TESTE } from '../apoio/especiesDeTeste';

const registro = (id: string, apelido: string) => ({ id, idEspecie: 'tomate', apelido, aparencia: APARENCIA_INICIAL });
const lerJson = (armazenamento: ArmazenamentoEmMemoria, chave: string) =>
  JSON.parse(armazenamento.valores.get(chave) ?? 'null');

describe('da versão 0 para a 1 (e daí até a atual)', () => {
  test('instalação nova só grava a versão atual', async () => {
    const armazenamento = new ArmazenamentoEmMemoria();
    await new MigradorDoArmazenamento(armazenamento).migrar();
    expect(Object.fromEntries(armazenamento.valores)).toEqual({ 'fitosfera:versao-do-schema': '2' });
  });

  test('o jardim gravado antes do versionamento continua aparecendo depois da atualização', async () => {
    const antigas = JSON.stringify([registro('p1', 'Tomatinho'), registro('p2', 'Manjericão')]);
    const armazenamento = new ArmazenamentoEmMemoria({ '@fitosfera/plantas': antigas });
    const repo = new RepositorioDePlantasAsyncStorage(
      new ArmazenamentoComMigracao(armazenamento, new MigradorDoArmazenamento(armazenamento)),
    );

    expect((await repo.listar()).map((planta) => planta.apelido)).toEqual(['Tomatinho', 'Manjericão']);
    expect(armazenamento.valores.get('fitosfera:v1:plantas')).toBe(antigas);
    expect(armazenamento.valores.get('fitosfera:versao-do-schema')).toBe('2');
    // A chave antiga fica como cópia de segurança.
    expect(armazenamento.valores.get('@fitosfera/plantas')).toBe(antigas);
  });

  test('leva junto a cópia do conteúdo ilegível', async () => {
    const armazenamento = new ArmazenamentoEmMemoria({
      '@fitosfera/plantas': '[]',
      '@fitosfera/plantas:ilegivel': '{quebrado',
    });
    await new MigradorDoArmazenamento(armazenamento).migrar();
    expect(armazenamento.valores.get('fitosfera:v1:plantas:ilegivel')).toBe('{quebrado');
    expect(armazenamento.valores.get('fitosfera:v2:plantas:ilegivel')).toBe('{quebrado');
  });

  test('retomada depois de uma tentativa interrompida junta as listas sem repetir planta', async () => {
    const armazenamento = new ArmazenamentoEmMemoria({
      '@fitosfera/plantas': JSON.stringify([registro('p1', 'Antiga'), registro('p2', 'Já migrada')]),
      'fitosfera:v1:plantas': JSON.stringify([registro('p2', 'Já migrada'), registro('p3', 'Nova')]),
    });
    await new MigradorDoArmazenamento(armazenamento).migrar();
    expect(lerJson(armazenamento, 'fitosfera:v1:plantas').map((r: { id: string }) => r.id)).toEqual(['p1', 'p2', 'p3']);
  });

  test('chave antiga corrompida não impede a migração nem o app de abrir', async () => {
    const armazenamento = new ArmazenamentoEmMemoria({ '@fitosfera/plantas': '{quebrado' });
    const repo = new RepositorioDePlantasAsyncStorage(
      new ArmazenamentoComMigracao(armazenamento, new MigradorDoArmazenamento(armazenamento)),
    );
    expect(await repo.listar()).toEqual([]);
    await repo.adicionar(Planta.criar({ id: 'p1', idEspecie: 'tomate', apelido: 'Nova', aparencia: APARENCIA_INICIAL }));
    expect(armazenamento.valores.get('fitosfera:v2:plantas:ilegivel')).toBe('{quebrado');
    expect(armazenamento.valores.get('fitosfera:versao-do-schema')).toBe('2');
  });

  test('já na versão atual, não mexe em nada', async () => {
    const armazenamento = new ArmazenamentoEmMemoria({
      'fitosfera:versao-do-schema': '2',
      '@fitosfera/plantas': JSON.stringify([registro('p9', 'Esquecida')]),
    });
    await new MigradorDoArmazenamento(armazenamento).migrar();
    expect(armazenamento.valores.has('fitosfera:v1:plantas')).toBe(false);
  });
});

describe('da versão 1 para a 2: faixas recomendadas nas plantas já cadastradas', () => {
  const catalogo = new RepositorioDeEspeciesLocal(ESPECIES_DE_TESTE);
  const migrarParaV2 = (armazenamento: ArmazenamentoEmMemoria) => criarMigracaoParaVersao2(catalogo).aplicar(armazenamento);
  const plantasV2 = (armazenamento: ArmazenamentoEmMemoria) => lerJson(armazenamento, 'fitosfera:v2:plantas');

  test('cada planta ganha uma cópia das faixas que a espécie tem no catálogo no momento da migração', async () => {
    const armazenamento = new ArmazenamentoEmMemoria({
      'fitosfera:v1:plantas': JSON.stringify([registro('p1', 'Tomatinho'), { ...registro('p2', 'Some'), idEspecie: 'sumiu' }]),
    });
    await migrarParaV2(armazenamento);
    expect(plantasV2(armazenamento)).toEqual([
      { ...registro('p1', 'Tomatinho'), faixasRecomendadas: FAIXAS_DE_TESTE },
      { ...registro('p2', 'Some'), idEspecie: 'sumiu', faixasRecomendadas: null },
    ]);
    // A chave antiga fica como cópia de segurança.
    expect(lerJson(armazenamento, 'fitosfera:v1:plantas')).toHaveLength(2);
  });

  test('não troca faixas que o registro já tem nem mexe em registros que o app não entende', async () => {
    const proprias = { ...FAIXAS_DE_TESTE, temperatura: { minimo: 10, maximo: 12 } };
    const estranho = { id: 'x' };
    const armazenamento = new ArmazenamentoEmMemoria({
      'fitosfera:v1:plantas': JSON.stringify([{ ...registro('p1', 'Própria'), faixasRecomendadas: proprias }, estranho, 'lixo']),
    });
    await migrarParaV2(armazenamento);
    expect(plantasV2(armazenamento)).toEqual([
      { ...registro('p1', 'Própria'), faixasRecomendadas: proprias },
      estranho,
      'lixo',
    ]);
  });

  test('conteúdo ilegível vai para a chave nova como estava, junto com a cópia de segurança', async () => {
    const armazenamento = new ArmazenamentoEmMemoria({
      'fitosfera:v1:plantas': '{quebrado',
      'fitosfera:v1:plantas:ilegivel': '{mais antigo',
    });
    await migrarParaV2(armazenamento);
    expect(armazenamento.valores.get('fitosfera:v2:plantas')).toBe('{quebrado');
    expect(armazenamento.valores.get('fitosfera:v2:plantas:ilegivel')).toBe('{mais antigo');
  });

  test('rodar de novo não duplica plantas nem apaga as cadastradas depois de uma tentativa interrompida', async () => {
    const armazenamento = new ArmazenamentoEmMemoria({
      'fitosfera:v1:plantas': JSON.stringify([registro('p1', 'Antiga')]),
    });
    await migrarParaV2(armazenamento);
    const nova = { ...registro('p2', 'Nova'), faixasRecomendadas: FAIXAS_DE_TESTE };
    await armazenamento.setItem('fitosfera:v2:plantas', JSON.stringify([...plantasV2(armazenamento), nova]));

    await migrarParaV2(armazenamento);
    expect(plantasV2(armazenamento).map((r: { id: string }) => r.id)).toEqual(['p1', 'p2']);
  });

  test('sem nada na versão 1, não cria a chave nova', async () => {
    const armazenamento = new ArmazenamentoEmMemoria();
    await migrarParaV2(armazenamento);
    expect(armazenamento.valores.size).toBe(0);
  });

  test('pelo migrador, um jardim da versão 1 abre na versão 2 com as faixas do catálogo embutido', async () => {
    const armazenamento = new ArmazenamentoEmMemoria({
      'fitosfera:versao-do-schema': '1',
      'fitosfera:v1:plantas': JSON.stringify([registro('p1', 'Tomatinho')]),
    });
    const repo = new RepositorioDePlantasAsyncStorage(
      new ArmazenamentoComMigracao(armazenamento, new MigradorDoArmazenamento(armazenamento)),
    );
    const [planta] = await repo.listar();
    const tomate = await new RepositorioDeEspeciesLocal().obterPorId('tomate');
    expect(planta.faixasRecomendadas).toEqual(copiarFaixas(tomate?.faixasIdeais ?? null));
    expect(planta.faixasRecomendadas).not.toBeNull();
    expect(armazenamento.valores.get('fitosfera:versao-do-schema')).toBe('2');
  });
});

describe('vários saltos de versão', () => {
  const diario: string[] = [];
  const migracao = (paraVersao: number, falhar = false): Migracao => ({
    paraVersao,
    async aplicar() {
      if (falhar) throw new Error(`falhou na ${paraVersao}`);
      diario.push(`para ${paraVersao}`);
    },
  });
  beforeEach(() => diario.splice(0));

  test('aplica em ordem só as que faltam e grava a versão a cada passo', async () => {
    const armazenamento = new ArmazenamentoEmMemoria({ 'fitosfera:versao-do-schema': '1' });
    await new MigradorDoArmazenamento(armazenamento, [migracao(3), migracao(1), migracao(2)], 3).migrar();
    expect(diario).toEqual(['para 2', 'para 3']);
    expect(armazenamento.valores.get('fitosfera:versao-do-schema')).toBe('3');
  });

  test('se um passo falha, a versão para no último que deu certo e a próxima abertura continua dali', async () => {
    const armazenamento = new ArmazenamentoEmMemoria({ 'fitosfera:versao-do-schema': '1' });
    await expect(
      new MigradorDoArmazenamento(armazenamento, [migracao(1), migracao(2), migracao(3, true)], 3).migrar(),
    ).rejects.toThrow('falhou na 3');
    expect(armazenamento.valores.get('fitosfera:versao-do-schema')).toBe('2');

    await new MigradorDoArmazenamento(armazenamento, [migracao(1), migracao(2), migracao(3)], 3).migrar();
    expect(diario).toEqual(['para 2', 'para 3']);
    expect(armazenamento.valores.get('fitosfera:versao-do-schema')).toBe('3');
  });

  test('versão gravada ilegível é tratada como 0 e todas as migrações rodam', async () => {
    const armazenamento = new ArmazenamentoEmMemoria({ 'fitosfera:versao-do-schema': 'abc' });
    await new MigradorDoArmazenamento(armazenamento, [migracao(1), migracao(2)], 2).migrar();
    expect(diario).toEqual(['para 1', 'para 2']);
  });

  test('dados de uma versão mais nova que o app ficam como estão', async () => {
    const armazenamento = new ArmazenamentoEmMemoria({ 'fitosfera:versao-do-schema': '5' });
    await new MigradorDoArmazenamento(armazenamento, [migracao(1), migracao(2)], 2).migrar();
    expect(diario).toEqual([]);
    expect(armazenamento.valores.get('fitosfera:versao-do-schema')).toBe('5');
  });

  test('lista de migrações com buraco é recusada', () => {
    expect(() => new MigradorDoArmazenamento(new ArmazenamentoEmMemoria(), [migracao(1), migracao(3)], 3)).toThrow(
      'Falta a migração para a versão 2.',
    );
  });
});

describe('ArmazenamentoComMigracao', () => {
  test('migra uma vez só, mesmo com acessos simultâneos', async () => {
    const armazenamento = new ArmazenamentoEmMemoria();
    const migrador = new MigradorDoArmazenamento(armazenamento);
    const migrar = jest.spyOn(migrador, 'migrar');
    const comMigracao = new ArmazenamentoComMigracao(armazenamento, migrador);

    await Promise.all([comMigracao.getItem('a'), comMigracao.getItem('b'), comMigracao.setItem('c', '1')]);
    await comMigracao.getItem('a');
    expect(migrar).toHaveBeenCalledTimes(1);
  });

  test('falha na migração não impede ler e gravar', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const quebrado: ArmazenamentoChaveValor = {
      getItem: async () => {
        throw new Error('disco cheio');
      },
      setItem: async () => undefined,
    };
    const armazenamento = new ArmazenamentoEmMemoria({ 'fitosfera:v2:plantas': '[]' });
    const comMigracao = new ArmazenamentoComMigracao(armazenamento, new MigradorDoArmazenamento(quebrado));

    expect(await comMigracao.getItem('fitosfera:v2:plantas')).toBe('[]');
    expect(aviso).toHaveBeenCalledTimes(1);
    aviso.mockRestore();
  });
});

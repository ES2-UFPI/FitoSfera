import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { Planta } from '@/dominio/modelos/Planta';
import { ArmazenamentoChaveValor } from '@/infraestrutura/persistencia/ArmazenamentoChaveValor';
import { ArmazenamentoComMigracao } from '@/infraestrutura/persistencia/ArmazenamentoComMigracao';
import { MigradorDoArmazenamento } from '@/infraestrutura/persistencia/MigradorDoArmazenamento';
import { Migracao } from '@/infraestrutura/persistencia/migracoes';
import { RepositorioDePlantasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDePlantasAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';

const registro = (id: string, apelido: string) => ({ id, idEspecie: 'tomate', apelido, aparencia: APARENCIA_INICIAL });
const lerJson = (armazenamento: ArmazenamentoEmMemoria, chave: string) =>
  JSON.parse(armazenamento.valores.get(chave) ?? 'null');

describe('da versão 0 para a 1', () => {
  test('instalação nova só grava a versão atual', async () => {
    const armazenamento = new ArmazenamentoEmMemoria();
    await new MigradorDoArmazenamento(armazenamento).migrar();
    expect(Object.fromEntries(armazenamento.valores)).toEqual({ 'fitosfera:versao-do-schema': '1' });
  });

  test('o jardim gravado antes do versionamento continua aparecendo depois da atualização', async () => {
    const antigas = JSON.stringify([registro('p1', 'Tomatinho'), registro('p2', 'Manjericão')]);
    const armazenamento = new ArmazenamentoEmMemoria({ '@fitosfera/plantas': antigas });
    const repo = new RepositorioDePlantasAsyncStorage(
      new ArmazenamentoComMigracao(armazenamento, new MigradorDoArmazenamento(armazenamento)),
    );

    expect((await repo.listar()).map((planta) => planta.apelido)).toEqual(['Tomatinho', 'Manjericão']);
    expect(armazenamento.valores.get('fitosfera:v1:plantas')).toBe(antigas);
    expect(armazenamento.valores.get('fitosfera:versao-do-schema')).toBe('1');
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
    expect(armazenamento.valores.get('fitosfera:v1:plantas:ilegivel')).toBe('{quebrado');
    expect(armazenamento.valores.get('fitosfera:versao-do-schema')).toBe('1');
  });

  test('já na versão atual, não mexe em nada', async () => {
    const armazenamento = new ArmazenamentoEmMemoria({
      'fitosfera:versao-do-schema': '1',
      '@fitosfera/plantas': JSON.stringify([registro('p9', 'Esquecida')]),
    });
    await new MigradorDoArmazenamento(armazenamento).migrar();
    expect(armazenamento.valores.has('fitosfera:v1:plantas')).toBe(false);
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
    const armazenamento = new ArmazenamentoEmMemoria({ 'fitosfera:v1:plantas': '[]' });
    const comMigracao = new ArmazenamentoComMigracao(armazenamento, new MigradorDoArmazenamento(quebrado));

    expect(await comMigracao.getItem('fitosfera:v1:plantas')).toBe('[]');
    expect(aviso).toHaveBeenCalledTimes(1);
    aviso.mockRestore();
  });
});

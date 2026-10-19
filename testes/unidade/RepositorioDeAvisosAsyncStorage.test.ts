import { RepositorioDeAvisosAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeAvisosAsyncStorage';
import { CHAVES } from '@/infraestrutura/persistencia/chaves';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';

test('sem nada gravado, não há desvio avisado', async () => {
  const repositorio = new RepositorioDeAvisosAsyncStorage(new ArmazenamentoEmMemoria());
  expect(await repositorio.listar()).toEqual(new Map());
});

test('as assinaturas continuam disponíveis depois de reabrir o repositório', async () => {
  const armazenamento = new ArmazenamentoEmMemoria();
  await new RepositorioDeAvisosAsyncStorage(armazenamento).gravar(
    new Map([
      ['p1', 'temperatura:acima'],
      ['p2', 'umidadeDoAr:abaixo'],
    ]),
  );

  const reaberto = new RepositorioDeAvisosAsyncStorage(armazenamento);
  expect(await reaberto.listar()).toEqual(
    new Map([
      ['p1', 'temperatura:acima'],
      ['p2', 'umidadeDoAr:abaixo'],
    ]),
  );
});

test('gravar um mapa vazio apaga a chave, em vez de deixar lixo no aparelho', async () => {
  const armazenamento = new ArmazenamentoEmMemoria();
  const repositorio = new RepositorioDeAvisosAsyncStorage(armazenamento);
  await repositorio.gravar(new Map([['p1', 'temperatura:acima']]));

  await repositorio.gravar(new Map());

  expect(armazenamento.valores.has(CHAVES.avisos)).toBe(false);
  expect(await repositorio.listar()).toEqual(new Map());
});

test.each(['isto não é json', '["lista"]', '{"p1":42}'])(
  'conteúdo ilegível (%s) é lido como nenhum desvio avisado',
  async (gravado) => {
    const armazenamento = new ArmazenamentoEmMemoria({ [CHAVES.avisos]: gravado });
    expect(await new RepositorioDeAvisosAsyncStorage(armazenamento).listar()).toEqual(new Map());
  },
);

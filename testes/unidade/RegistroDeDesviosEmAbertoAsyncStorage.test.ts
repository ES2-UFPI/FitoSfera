import { CHAVES } from '@/infraestrutura/persistencia/chaves';
import { RegistroDeDesviosEmAbertoAsyncStorage } from '@/infraestrutura/persistencia/RegistroDeDesviosEmAbertoAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';

const DESDE = new Date(2026, 10, 12, 14, 0);

test('sem nada gravado, não há desvio em aberto', async () => {
  expect(await new RegistroDeDesviosEmAbertoAsyncStorage(new ArmazenamentoEmMemoria()).listar()).toEqual(new Map());
});

test('desde quando cada desvio aparece continua disponível depois de reabrir o registro', async () => {
  const armazenamento = new ArmazenamentoEmMemoria();
  const desvios = new Map([['p1', new Map([['temperatura:acima', DESDE], ['umidadeDoAr:abaixo', DESDE]])]]);
  await new RegistroDeDesviosEmAbertoAsyncStorage(armazenamento).gravar(desvios);

  expect(await new RegistroDeDesviosEmAbertoAsyncStorage(armazenamento).listar()).toEqual(desvios);
});

test('gravar sem nenhum desvio apaga a chave, em vez de deixar lixo no aparelho', async () => {
  const armazenamento = new ArmazenamentoEmMemoria();
  const registro = new RegistroDeDesviosEmAbertoAsyncStorage(armazenamento);
  await registro.gravar(new Map([['p1', new Map([['temperatura:acima', DESDE]])]]));
  await registro.gravar(new Map([['p1', new Map()]]));

  expect(await armazenamento.getItem(CHAVES.desviosEmAberto)).toBeNull();
});

test('conteúdo ilegível é lido como nenhum desvio em aberto, e datas inválidas são descartadas', async () => {
  const armazenamento = new ArmazenamentoEmMemoria();
  const registro = new RegistroDeDesviosEmAbertoAsyncStorage(armazenamento);
  await armazenamento.setItem(CHAVES.desviosEmAberto, '{quebrado');
  expect(await registro.listar()).toEqual(new Map());

  await armazenamento.setItem(
    CHAVES.desviosEmAberto,
    JSON.stringify({ p1: { 'temperatura:acima': 'ontem', 'umidadeDoAr:abaixo': DESDE.toISOString() }, p2: 7 }),
  );
  expect(await registro.listar()).toEqual(new Map([['p1', new Map([['umidadeDoAr:abaixo', DESDE]])]]));
});

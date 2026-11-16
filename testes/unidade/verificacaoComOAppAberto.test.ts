import {
  acompanharLeiturasComOAppAberto,
  INTERVALO_DA_VERIFICACAO_COM_O_APP_ABERTO_MS,
} from '@/composicao/verificacaoComOAppAberto';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

function containerFalso(duracaoMs = 0) {
  const atualizar = jest.fn().mockResolvedValue(undefined);
  const executar = jest.fn(
    () => new Promise<readonly never[]>((resolver) => setTimeout(() => resolver([]), duracaoMs)),
  );
  return { container: { atualizarLeituras: { executar: atualizar }, avaliarLeitura: { executar } }, atualizar, executar };
}

test('com o app aberto, atualiza e avalia as leituras a cada cinco minutos, no ritmo do firmware', async () => {
  expect(INTERVALO_DA_VERIFICACAO_COM_O_APP_ABERTO_MS).toBe(5 * 60_000);
  const { container, atualizar, executar } = containerFalso();
  acompanharLeiturasComOAppAberto(container);

  await jest.advanceTimersByTimeAsync(15 * 60_000);
  expect(atualizar).toHaveBeenCalledTimes(3);
  expect(executar).toHaveBeenCalledTimes(3);
});

test('parar o acompanhamento encerra as verificações', async () => {
  const { container, atualizar, executar } = containerFalso();
  const parar = acompanharLeiturasComOAppAberto(container);
  await jest.advanceTimersByTimeAsync(5 * 60_000);
  parar();
  await jest.advanceTimersByTimeAsync(5 * 60_000);
  expect(executar).toHaveBeenCalledTimes(1);
  expect(atualizar).toHaveBeenCalledTimes(1);
});

test('não começa uma verificação enquanto a anterior ainda espera o sensor', async () => {
  // Um ciclo pode superar cinco minutos; outra execução por cima só pediria a mesma leitura.
  const { container, atualizar, executar } = containerFalso(6 * 60_000);
  acompanharLeiturasComOAppAberto(container, 60_000);
  await jest.advanceTimersByTimeAsync(6 * 60_000);
  expect(atualizar).toHaveBeenCalledTimes(1);
  expect(executar).toHaveBeenCalledTimes(1);
});

test('atualiza as leituras antes de avaliá-las', async () => {
  const ordem: string[] = [];
  const container = {
    atualizarLeituras: { executar: jest.fn(async () => { ordem.push('atualizar'); }) },
    avaliarLeitura: { executar: jest.fn(async () => { ordem.push('avaliar'); return []; }) },
  };
  acompanharLeiturasComOAppAberto(container);

  await jest.advanceTimersByTimeAsync(5 * 60_000);

  expect(ordem).toEqual(['atualizar', 'avaliar']);
});

test('uma verificação que falha não interrompe as próximas', async () => {
  const atualizar = jest.fn().mockResolvedValue(undefined);
  const executar = jest.fn().mockRejectedValueOnce(new Error('falhou')).mockResolvedValue([]);
  acompanharLeiturasComOAppAberto({ atualizarLeituras: { executar: atualizar }, avaliarLeitura: { executar } });
  await jest.advanceTimersByTimeAsync(10 * 60_000);
  expect(executar).toHaveBeenCalledTimes(2);
  expect(atualizar).toHaveBeenCalledTimes(2);
});

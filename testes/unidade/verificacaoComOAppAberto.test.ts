import {
  acompanharLeiturasComOAppAberto,
  INTERVALO_DA_VERIFICACAO_COM_O_APP_ABERTO_MS,
} from '@/composicao/verificacaoComOAppAberto';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

function containerFalso(duracaoMs = 0) {
  const executar = jest.fn(
    () => new Promise<readonly never[]>((resolver) => setTimeout(() => resolver([]), duracaoMs)),
  );
  return { container: { avaliarLeitura: { executar } }, executar };
}

test('com o app aberto, avalia as leituras a cada minuto, no ritmo do sensor', async () => {
  expect(INTERVALO_DA_VERIFICACAO_COM_O_APP_ABERTO_MS).toBe(60_000);
  const { container, executar } = containerFalso();
  acompanharLeiturasComOAppAberto(container);

  await jest.advanceTimersByTimeAsync(3 * 60_000);
  expect(executar).toHaveBeenCalledTimes(3);
});

test('parar o acompanhamento encerra as verificações', async () => {
  const { container, executar } = containerFalso();
  const parar = acompanharLeiturasComOAppAberto(container);
  await jest.advanceTimersByTimeAsync(60_000);
  parar();
  await jest.advanceTimersByTimeAsync(5 * 60_000);
  expect(executar).toHaveBeenCalledTimes(1);
});

test('não começa uma verificação enquanto a anterior ainda espera o sensor', async () => {
  // Uma verificação pode levar até o tempo limite da leitura; outra por cima só pediria a mesma leitura.
  const { container, executar } = containerFalso(90_000);
  acompanharLeiturasComOAppAberto(container);
  await jest.advanceTimersByTimeAsync(120_000);
  expect(executar).toHaveBeenCalledTimes(1);
});

test('uma verificação que falha não interrompe as próximas', async () => {
  const executar = jest.fn().mockRejectedValueOnce(new Error('falhou')).mockResolvedValue([]);
  acompanharLeiturasComOAppAberto({ avaliarLeitura: { executar } });
  await jest.advanceTimersByTimeAsync(2 * 60_000);
  expect(executar).toHaveBeenCalledTimes(2);
});

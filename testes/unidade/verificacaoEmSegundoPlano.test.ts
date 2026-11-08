const registrarVerificacaoPeriodica = jest.fn(async (_intervalo?: number) => true);
const definirTarefaDeVerificacao = jest.fn((_plataforma: string, trabalho: () => Promise<void>) => {
  tarefaDeFundo = trabalho;
  return true;
});
let tarefaDeFundo: (() => Promise<void>) | undefined;
const criarContainer = jest.fn();

jest.mock('@/infraestrutura/notificacoes/VerificacaoPeriodica', () => ({
  definirTarefaDeVerificacao: (...args: Parameters<typeof definirTarefaDeVerificacao>) => definirTarefaDeVerificacao(...args),
  registrarVerificacaoPeriodica: (...args: Parameters<typeof registrarVerificacaoPeriodica>) => registrarVerificacaoPeriodica(...args),
  INTERVALO_EM_MINUTOS: 15,
}));
jest.mock('@/composicao/criarContainer', () => ({ criarContainer: () => criarContainer() }));
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

import { ligarVerificacaoEmSegundoPlano } from '@/composicao/verificacaoEmSegundoPlano';

beforeEach(() => {
  jest.clearAllMocks();
  tarefaDeFundo = undefined;
});

test('na abertura, registra a tarefa com o intervalo configurado antes de atualizar e avaliar', async () => {
  const ordem: string[] = [];
  registrarVerificacaoPeriodica.mockImplementationOnce(async (intervalo) => {
    ordem.push(`registrar:${intervalo}`);
    return true;
  });
  const container = {
    atualizarLeituras: { executar: jest.fn(async () => { ordem.push('atualizar'); }) },
    avaliarLeitura: { executar: jest.fn(async () => { ordem.push('avaliar'); }) },
  };

  await ligarVerificacaoEmSegundoPlano(container, 20);

  expect(ordem).toEqual(['registrar:20', 'atualizar', 'avaliar']);
  expect(registrarVerificacaoPeriodica).toHaveBeenCalledWith(20);
});

test('uma falha na execução inicial acontece depois que a próxima tarefa já foi registrada', async () => {
  const ordem: string[] = [];
  registrarVerificacaoPeriodica.mockImplementationOnce(async () => {
    ordem.push('registrar');
    return true;
  });
  const container = {
    atualizarLeituras: { executar: jest.fn(async () => { ordem.push('atualizar'); throw new Error('rede indisponível'); }) },
    avaliarLeitura: { executar: jest.fn(async () => { ordem.push('avaliar'); }) },
  };

  await expect(ligarVerificacaoEmSegundoPlano(container)).rejects.toThrow('rede indisponível');

  expect(ordem).toEqual(['registrar', 'atualizar']);
  expect(registrarVerificacaoPeriodica).toHaveBeenCalledTimes(1);
});

test('a tarefa de fundo também atualiza antes de avaliar', async () => {
  const ordem: string[] = [];
  const container = {
    atualizarLeituras: { executar: jest.fn(async () => { ordem.push('atualizar'); }) },
    avaliarLeitura: { executar: jest.fn(async () => { ordem.push('avaliar'); }) },
  };
  criarContainer.mockReturnValue(container);

  jest.resetModules();
  await import('@/composicao/verificacaoEmSegundoPlano');
  expect(tarefaDeFundo).toBeDefined();
  await tarefaDeFundo?.();

  expect(ordem).toEqual(['atualizar', 'avaliar']);
});

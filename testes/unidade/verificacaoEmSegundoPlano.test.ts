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

test('na abertura, atualiza antes de avaliar e agenda usando o intervalo configurado', async () => {
  const ordem: string[] = [];
  const container = {
    atualizarLeituras: { executar: jest.fn(async () => { ordem.push('atualizar'); }) },
    avaliarLeitura: { executar: jest.fn(async () => { ordem.push('avaliar'); }) },
  };

  await ligarVerificacaoEmSegundoPlano(container, 20);

  expect(ordem).toEqual(['atualizar', 'avaliar']);
  expect(registrarVerificacaoPeriodica).toHaveBeenCalledWith(20);
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

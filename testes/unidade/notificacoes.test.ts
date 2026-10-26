import { ToqueNaNotificacao } from '@/aplicacao/portas/ToquesNaNotificacao';
import { escolherNotificador } from '@/composicao/escolherNotificador';
import { escolherToquesNaNotificacao } from '@/composicao/escolherToquesNaNotificacao';
import { NotificadorExpo } from '@/infraestrutura/notificacoes/NotificadorExpo';
import { NotificadorInativo } from '@/infraestrutura/notificacoes/NotificadorInativo';
import { ToquesInativos } from '@/infraestrutura/notificacoes/ToquesInativos';
import { ToquesNaNotificacaoExpo } from '@/infraestrutura/notificacoes/ToquesNaNotificacaoExpo';

/**
 * Os módulos do Expo entram no `NotificadorExpo` e na `VerificacaoPeriodica` por importação sob demanda, e
 * fora de um build nativo eles não existem: aqui entram dublês no lugar deles.
 */
const notificacoesFalsas = {
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  getLastNotificationResponse: jest.fn(),
  clearLastNotificationResponse: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
};

const gerenciadorDeTarefasFalso = {
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn(),
};

const tarefaDeFundoFalsa = {
  getStatusAsync: jest.fn(),
  registerTaskAsync: jest.fn(),
  BackgroundTaskResult: { Success: 'sucesso', Failed: 'falha' },
  BackgroundTaskStatus: { Available: 'disponivel', Restricted: 'restrito' },
};

jest.mock('expo-notifications', () => notificacoesFalsas);
jest.mock('expo-task-manager', () => gerenciadorDeTarefasFalso);
jest.mock('expo-background-task', () => tarefaDeFundoFalsa);

beforeEach(() => jest.clearAllMocks());

describe('escolherNotificador (plataforma)', () => {
  test('no Android entra o notificador do Expo, que notifica de verdade', () => {
    expect(escolherNotificador('android')).toBeInstanceOf(NotificadorExpo);
  });

  test.each(['web', 'ios', ''])('em "%s" entra o notificador inativo', (plataforma) => {
    expect(escolherNotificador(plataforma)).toBeInstanceOf(NotificadorInativo);
  });
});

describe('NotificadorInativo', () => {
  const notificador = new NotificadorInativo();

  test('nunca tem permissão, então o caso de uso para antes de avaliar as leituras', async () => {
    expect(await notificador.garantirPermissao()).toBe(false);
  });

  test('notificar não faz nada e não quebra', async () => {
    await expect(notificador.notificar()).resolves.toBeUndefined();
  });
});

describe('NotificadorExpo', () => {
  test('permissão já concedida não abre diálogo nenhum', async () => {
    notificacoesFalsas.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });

    expect(await new NotificadorExpo().garantirPermissao()).toBe(true);
    expect(notificacoesFalsas.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  test('na primeira execução pede a permissão, e a resposta da pessoa é a resposta', async () => {
    notificacoesFalsas.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    notificacoesFalsas.requestPermissionsAsync.mockResolvedValue({ granted: true });

    expect(await new NotificadorExpo().garantirPermissao()).toBe(true);
    expect(notificacoesFalsas.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  test('pessoa que recusa no diálogo fica sem notificação', async () => {
    notificacoesFalsas.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    notificacoesFalsas.requestPermissionsAsync.mockResolvedValue({ granted: false });

    expect(await new NotificadorExpo().garantirPermissao()).toBe(false);
  });

  test('recusa antiga não vira um diálogo que não apareceria', async () => {
    notificacoesFalsas.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });

    expect(await new NotificadorExpo().garantirPermissao()).toBe(false);
    expect(notificacoesFalsas.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  test('o aviso sai no canal dos desvios, com o id da planta para o toque abrir o detalhe', async () => {
    const { CANAL_DOS_DESVIOS } = await import('@/infraestrutura/notificacoes/NotificadorExpo');
    const notificador = new NotificadorExpo();

    await notificador.notificar({ idPlanta: 'p1', titulo: 'Tomatinho precisa de atenção', corpo: 'Está quente.' });
    await notificador.notificar({ idPlanta: 'p2', titulo: 'Jiboia precisa de atenção', corpo: 'Está seca.' });

    expect(notificacoesFalsas.scheduleNotificationAsync).toHaveBeenNthCalledWith(1, {
      content: { title: 'Tomatinho precisa de atenção', body: 'Está quente.', data: { idPlanta: 'p1' } },
      trigger: { channelId: CANAL_DOS_DESVIOS },
    });
    // O canal é criado uma vez só: o segundo aviso já o encontra pronto.
    expect(notificacoesFalsas.setNotificationChannelAsync).toHaveBeenCalledTimes(1);
    expect(notificacoesFalsas.setNotificationChannelAsync).toHaveBeenCalledWith(
      CANAL_DOS_DESVIOS,
      expect.objectContaining({ importance: notificacoesFalsas.AndroidImportance.DEFAULT }),
    );
  });

  test('aviso que chega com o app aberto aparece na tela', async () => {
    notificacoesFalsas.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });

    await new NotificadorExpo().garantirPermissao();

    const [tratamento] = notificacoesFalsas.setNotificationHandler.mock.calls[0];
    expect(await tratamento.handleNotification()).toMatchObject({ shouldShowBanner: true });
  });

  test('falha ao consultar a permissão não derruba a verificação', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    notificacoesFalsas.getPermissionsAsync.mockRejectedValue(new Error('sem módulo nativo'));

    expect(await new NotificadorExpo().garantirPermissao()).toBe(false);
    expect(aviso).toHaveBeenCalled();
    aviso.mockRestore();
  });
});

describe('VerificacaoPeriodica', () => {
  /** O módulo lembra se a tarefa já foi definida; cada teste começa com ele recém-carregado. */
  async function carregar() {
    jest.resetModules();
    return import('@/infraestrutura/notificacoes/VerificacaoPeriodica');
  }

  const trabalho = () => Promise.resolve();

  test('fora do Android não há verificação em segundo plano', async () => {
    const { definirTarefaDeVerificacao } = await carregar();

    expect(definirTarefaDeVerificacao('web', trabalho)).toBe(false);
    expect(gerenciadorDeTarefasFalso.defineTask).not.toHaveBeenCalled();
  });

  test('no Android a tarefa é definida uma vez, por mais que o módulo seja chamado de novo', async () => {
    const { definirTarefaDeVerificacao, NOME_DA_TAREFA } = await carregar();

    expect(definirTarefaDeVerificacao('android', trabalho)).toBe(true);
    expect(definirTarefaDeVerificacao('android', trabalho)).toBe(true);
    expect(gerenciadorDeTarefasFalso.defineTask).toHaveBeenCalledTimes(1);
    expect(gerenciadorDeTarefasFalso.defineTask).toHaveBeenCalledWith(NOME_DA_TAREFA, expect.any(Function));
  });

  test('a tarefa já está definida no retorno, sem esperar nada: o Android a procura logo na carga', async () => {
    const { definirTarefaDeVerificacao } = await carregar();

    definirTarefaDeVerificacao('android', trabalho);

    expect(gerenciadorDeTarefasFalso.defineTask).toHaveBeenCalledTimes(1);
  });

  test('a tarefa roda o trabalho e diz ao sistema que deu certo', async () => {
    const { definirTarefaDeVerificacao } = await carregar();
    const avaliar = jest.fn().mockResolvedValue(undefined);
    definirTarefaDeVerificacao('android', avaliar);

    const [, tarefa] = gerenciadorDeTarefasFalso.defineTask.mock.calls[0];
    expect(await tarefa()).toBe(tarefaDeFundoFalsa.BackgroundTaskResult.Success);
    expect(avaliar).toHaveBeenCalledTimes(1);
  });

  test('trabalho que falha não sobe: o sistema só ouve que a execução falhou', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { definirTarefaDeVerificacao } = await carregar();
    definirTarefaDeVerificacao('android', () => Promise.reject(new Error('sem leitura')));

    const [, tarefa] = gerenciadorDeTarefasFalso.defineTask.mock.calls[0];
    await expect(tarefa()).resolves.toBe(tarefaDeFundoFalsa.BackgroundTaskResult.Failed);
    expect(aviso).toHaveBeenCalled();
    aviso.mockRestore();
  });

  test('sem a tarefa definida não há o que registrar', async () => {
    const { registrarVerificacaoPeriodica } = await carregar();

    expect(await registrarVerificacaoPeriodica()).toBe(false);
    expect(tarefaDeFundoFalsa.registerTaskAsync).not.toHaveBeenCalled();
  });

  test('registra a tarefa com o intervalo pedido', async () => {
    const { definirTarefaDeVerificacao, registrarVerificacaoPeriodica, INTERVALO_EM_MINUTOS, NOME_DA_TAREFA } =
      await carregar();
    tarefaDeFundoFalsa.getStatusAsync.mockResolvedValue(tarefaDeFundoFalsa.BackgroundTaskStatus.Available);
    gerenciadorDeTarefasFalso.isTaskRegisteredAsync.mockResolvedValue(false);
    definirTarefaDeVerificacao('android', trabalho);

    expect(await registrarVerificacaoPeriodica()).toBe(true);
    expect(tarefaDeFundoFalsa.registerTaskAsync).toHaveBeenCalledWith(NOME_DA_TAREFA, {
      minimumInterval: INTERVALO_EM_MINUTOS,
    });
  });

  test('tarefa já registrada não é registrada de novo', async () => {
    const { definirTarefaDeVerificacao, registrarVerificacaoPeriodica } = await carregar();
    tarefaDeFundoFalsa.getStatusAsync.mockResolvedValue(tarefaDeFundoFalsa.BackgroundTaskStatus.Available);
    gerenciadorDeTarefasFalso.isTaskRegisteredAsync.mockResolvedValue(true);
    definirTarefaDeVerificacao('android', trabalho);

    expect(await registrarVerificacaoPeriodica()).toBe(true);
    expect(tarefaDeFundoFalsa.registerTaskAsync).not.toHaveBeenCalled();
  });

  test('aparelho que bloqueia a execução em segundo plano não registra nada', async () => {
    const { definirTarefaDeVerificacao, registrarVerificacaoPeriodica } = await carregar();
    tarefaDeFundoFalsa.getStatusAsync.mockResolvedValue(tarefaDeFundoFalsa.BackgroundTaskStatus.Restricted);
    definirTarefaDeVerificacao('android', trabalho);

    expect(await registrarVerificacaoPeriodica()).toBe(false);
    expect(tarefaDeFundoFalsa.registerTaskAsync).not.toHaveBeenCalled();
  });

  test('falha ao registrar não derruba a abertura do app', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { definirTarefaDeVerificacao, registrarVerificacaoPeriodica } = await carregar();
    tarefaDeFundoFalsa.getStatusAsync.mockRejectedValue(new Error('o sistema recusou'));
    definirTarefaDeVerificacao('android', trabalho);

    expect(await registrarVerificacaoPeriodica()).toBe(false);
    expect(aviso).toHaveBeenCalled();
    aviso.mockRestore();
  });
});

/** Monta a resposta que o Expo entrega num toque, com o payload que o `NotificadorExpo` grava. */
function respostaDoExpo(data: unknown, identifier = 'n1') {
  return { notification: { request: { identifier, content: { data } } } };
}

describe('escolherToquesNaNotificacao (plataforma)', () => {
  test('no Android entram os toques do Expo, que ouvem de verdade', () => {
    expect(escolherToquesNaNotificacao('android')).toBeInstanceOf(ToquesNaNotificacaoExpo);
  });

  test.each(['web', 'ios', ''])('em "%s" entram os toques inativos', (plataforma) => {
    expect(escolherToquesNaNotificacao(plataforma)).toBeInstanceOf(ToquesInativos);
  });
});

describe('ToquesInativos', () => {
  const toques = new ToquesInativos();

  test('nenhuma notificação abriu o app', async () => {
    expect(await toques.toqueQueAbriuOApp()).toBeNull();
  });

  test('cancelar a escuta não quebra, mesmo sem nada para cancelar', () => {
    expect(() => toques.aoTocar()()).not.toThrow();
  });
});

describe('ToquesNaNotificacaoExpo, o toque que abriu o app', () => {
  test('o id da planta vem do payload, junto com o id da notificação', async () => {
    notificacoesFalsas.getLastNotificationResponse.mockReturnValue(respostaDoExpo({ idPlanta: 'p1' }, 'n7'));

    expect(await new ToquesNaNotificacaoExpo().toqueQueAbriuOApp()).toEqual({
      idPlanta: 'p1',
      idDaNotificacao: 'n7',
    });
  });

  test('o toque tratado é esquecido, para uma remontagem não abrir a mesma planta de novo', async () => {
    notificacoesFalsas.getLastNotificationResponse.mockReturnValue(respostaDoExpo({ idPlanta: 'p1' }));

    await new ToquesNaNotificacaoExpo().toqueQueAbriuOApp();

    expect(notificacoesFalsas.clearLastNotificationResponse).toHaveBeenCalled();
  });

  test('abertura comum, sem toque nenhum', async () => {
    notificacoesFalsas.getLastNotificationResponse.mockReturnValue(null);

    expect(await new ToquesNaNotificacaoExpo().toqueQueAbriuOApp()).toBeNull();
    expect(notificacoesFalsas.clearLastNotificationResponse).not.toHaveBeenCalled();
  });

  test.each([{ data: undefined }, { data: {} }, { data: { idPlanta: 42 } }, { data: { idPlanta: '' } }])(
    'payload sem id de planta utilizável é ignorado ($data)',
    async ({ data }) => {
      notificacoesFalsas.getLastNotificationResponse.mockReturnValue(respostaDoExpo(data));

      expect(await new ToquesNaNotificacaoExpo().toqueQueAbriuOApp()).toBeNull();
    },
  );

  test('falha ao consultar não derruba a abertura do app', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    notificacoesFalsas.getLastNotificationResponse.mockImplementation(() => {
      throw new Error('o sistema recusou');
    });

    expect(await new ToquesNaNotificacaoExpo().toqueQueAbriuOApp()).toBeNull();
    expect(aviso).toHaveBeenCalled();
    aviso.mockRestore();
  });
});

describe('ToquesNaNotificacaoExpo, os toques com o app aberto', () => {
  /** O adaptador só assina depois que o `import()` sob demanda resolve. */
  const aguardarInscricao = () => new Promise((resolver) => setImmediate(resolver));

  function inscrever() {
    const remove = jest.fn();
    const recebidos: ToqueNaNotificacao[] = [];
    notificacoesFalsas.addNotificationResponseReceivedListener.mockReturnValue({ remove });
    const cancelar = new ToquesNaNotificacaoExpo().aoTocar((toque) => recebidos.push(toque));
    return { recebidos, remove, cancelar };
  }

  /** Entrega uma resposta ao ouvinte que o adaptador registrou no Expo. */
  function entregar(resposta: unknown) {
    notificacoesFalsas.addNotificationResponseReceivedListener.mock.calls[0][0](resposta);
  }

  test('o toque vira um aviso com a planta citada', async () => {
    const { recebidos } = inscrever();
    await aguardarInscricao();

    entregar(respostaDoExpo({ idPlanta: 'p2' }, 'n9'));

    expect(recebidos).toEqual([{ idPlanta: 'p2', idDaNotificacao: 'n9' }]);
  });

  test('toque sem id de planta não avisa ninguém', async () => {
    const { recebidos } = inscrever();
    await aguardarInscricao();

    entregar(respostaDoExpo({}));

    expect(recebidos).toEqual([]);
  });

  test('cancelar remove a inscrição', async () => {
    const { remove, cancelar } = inscrever();
    await aguardarInscricao();

    cancelar();

    expect(remove).toHaveBeenCalled();
  });

  test('cancelar antes de o módulo chegar não deixa inscrição para trás', async () => {
    const { remove, cancelar } = inscrever();

    cancelar();
    await aguardarInscricao();

    expect(notificacoesFalsas.addNotificationResponseReceivedListener).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});

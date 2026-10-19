/** O nome com que o Android guarda a tarefa; mudar isto deixa a tarefa antiga registrada para sempre. */
export const NOME_DA_TAREFA = 'fitosfera:verificar-leitura';

/**
 * O Android impõe um mínimo de cerca de 15 minutos e decide o instante exato pela bateria e pela rede:
 * este intervalo é uma intenção, não uma garantia.
 */
export const INTERVALO_EM_MINUTOS = 15;

let tarefaDefinida = false;

/**
 * Define a tarefa que o sistema executa em segundo plano. Precisa ser chamada assim que o pacote JavaScript
 * carrega, inclusive quando o Android acorda o app sem tela, porque é aí que o sistema procura a tarefa.
 *
 * Os módulos entram sob demanda, pelo mesmo motivo do `NotificadorExpo`: fora de um build nativo eles não
 * existem, e uma importação estática derrubaria a prévia web e os testes. A plataforma chega por parâmetro,
 * como em `escolherNotificador`, para esta decisão poder ser testada sem React Native.
 */
export async function definirTarefaDeVerificacao(
  plataforma: string,
  trabalho: () => Promise<void>,
): Promise<boolean> {
  if (plataforma !== 'android' || tarefaDefinida) return tarefaDefinida;
  try {
    const [GerenciadorDeTarefas, TarefaDeFundo] = await Promise.all([
      import('expo-task-manager'),
      import('expo-background-task'),
    ]);
    GerenciadorDeTarefas.defineTask(NOME_DA_TAREFA, async () => {
      try {
        await trabalho();
        return TarefaDeFundo.BackgroundTaskResult.Success;
      } catch (falha) {
        console.warn('A verificação periódica das leituras falhou.', falha);
        return TarefaDeFundo.BackgroundTaskResult.Failed;
      }
    });
    tarefaDefinida = true;
  } catch (falha) {
    console.warn('Não deu para definir a verificação periódica das leituras.', falha);
  }
  return tarefaDefinida;
}

/**
 * Pede ao sistema que execute a tarefa de tempos em tempos. Registrar de novo a mesma tarefa não duplica
 * nada, mas o registro só pega se a tarefa já tiver sido definida.
 */
export async function registrarVerificacaoPeriodica(
  intervaloEmMinutos = INTERVALO_EM_MINUTOS,
): Promise<boolean> {
  if (!tarefaDefinida) return false;
  try {
    const [GerenciadorDeTarefas, TarefaDeFundo] = await Promise.all([
      import('expo-task-manager'),
      import('expo-background-task'),
    ]);
    // Aparelho com economia de bateria agressiva, ou com a execução em segundo plano bloqueada.
    if ((await TarefaDeFundo.getStatusAsync()) !== TarefaDeFundo.BackgroundTaskStatus.Available) return false;
    if (await GerenciadorDeTarefas.isTaskRegisteredAsync(NOME_DA_TAREFA)) return true;
    await TarefaDeFundo.registerTaskAsync(NOME_DA_TAREFA, { minimumInterval: intervaloEmMinutos });
    return true;
  } catch (falha) {
    console.warn('Não deu para registrar a verificação periódica das leituras.', falha);
    return false;
  }
}

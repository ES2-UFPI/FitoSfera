import { ToqueNaNotificacao, ToquesNaNotificacao } from '@/aplicacao/portas/ToquesNaNotificacao';

type ModuloDeNotificacoes = typeof import('expo-notifications');
/** O mesmo que `NotificationResponse | null`, sem importar o tipo de forma estática. */
type RespostaDoToque = ReturnType<ModuloDeNotificacoes['getLastNotificationResponse']>;

/** Lê o toque da resposta do Expo; null quando o payload não traz um id de planta utilizável. */
function lerToque(resposta: RespostaDoToque): ToqueNaNotificacao | null {
  if (resposta === null) return null;
  const { identifier, content } = resposta.notification.request;
  const idPlanta = (content.data as { idPlanta?: unknown } | undefined)?.idPlanta;
  if (typeof idPlanta !== 'string' || idPlanta === '') return null;
  return { idPlanta, idDaNotificacao: identifier };
}

/**
 * Ouve os toques nas notificações do Android, pelo `expo-notifications`.
 *
 * O módulo é carregado sob demanda: importado de forma estática, ele quebra onde não existe (a prévia web
 * e o Expo Go). Toda falha de carregamento vira "não houve toque", nunca um erro que sobe para a tela.
 */
export class ToquesNaNotificacaoExpo implements ToquesNaNotificacao {
  async toqueQueAbriuOApp(): Promise<ToqueNaNotificacao | null> {
    try {
      const Notificacoes = await import('expo-notifications');
      const toque = lerToque(Notificacoes.getLastNotificationResponse());
      // A resposta fica guardada no sistema; sem limpar, uma remontagem abriria a mesma planta de novo.
      if (toque !== null) Notificacoes.clearLastNotificationResponse();
      return toque;
    } catch (falha) {
      console.warn('Não deu para ler o toque que abriu o app.', falha);
      return null;
    }
  }

  aoTocar(ouvinte: (toque: ToqueNaNotificacao) => void): () => void {
    let cancelado = false;
    let inscricao: { remove: () => void } | null = null;
    void import('expo-notifications')
      .then((Notificacoes) => {
        if (cancelado) return;
        inscricao = Notificacoes.addNotificationResponseReceivedListener((resposta) => {
          const toque = lerToque(resposta);
          if (toque !== null) ouvinte(toque);
        });
      })
      .catch((falha) => console.warn('Não deu para ouvir os toques na notificação.', falha));
    return () => {
      cancelado = true;
      inscricao?.remove();
    };
  }
}

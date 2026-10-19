import { Aviso, Notificador } from '@/dominio/portas/Notificador';

type ModuloDeNotificacoes = typeof import('expo-notifications');

/** O canal do Android onde os avisos aparecem; a pessoa pode silenciá-lo sem silenciar o app todo. */
export const CANAL_DOS_DESVIOS = 'desvios';

/**
 * Entrega o aviso como notificação local do Android, pelo `expo-notifications`.
 *
 * O módulo é carregado sob demanda: importado de forma estática, ele quebra onde não existe (a prévia web e
 * o Expo Go), e o app não abriria. Por isso toda falha de carregamento vira "não notifiquei", nunca um erro
 * que sobe para o caso de uso.
 */
export class NotificadorExpo implements Notificador {
  private modulo: Promise<ModuloDeNotificacoes> | null = null;
  private canalCriado = false;

  async garantirPermissao(): Promise<boolean> {
    try {
      const Notificacoes = await this.carregar();
      const atual = await Notificacoes.getPermissionsAsync();
      if (atual.granted) return true;
      // Recusada antes: pedir de novo não abre diálogo nenhum, só a pessoa reverte isso nos ajustes do sistema.
      if (!atual.canAskAgain) return false;
      return (await Notificacoes.requestPermissionsAsync()).granted;
    } catch (falha) {
      console.warn('Não deu para verificar a permissão de notificação.', falha);
      return false;
    }
  }

  async notificar(aviso: Aviso): Promise<void> {
    const Notificacoes = await this.carregar();
    await this.garantirCanal(Notificacoes);
    await Notificacoes.scheduleNotificationAsync({
      // O id da planta viaja junto para um toque na notificação poder abrir o detalhe dela.
      content: { title: aviso.titulo, body: aviso.corpo, data: { idPlanta: aviso.idPlanta } },
      // Trigger só com o canal: a notificação sai na hora, no canal certo.
      trigger: { channelId: CANAL_DOS_DESVIOS },
    });
  }

  /** O Android exige um canal para mostrar notificação; criar de novo o mesmo canal não tem efeito. */
  private async garantirCanal(Notificacoes: ModuloDeNotificacoes): Promise<void> {
    if (this.canalCriado) return;
    await Notificacoes.setNotificationChannelAsync(CANAL_DOS_DESVIOS, {
      name: 'Desvios da faixa ideal',
      description: 'Avisa quando a leitura do sensor sai da faixa ideal de uma planta.',
      importance: Notificacoes.AndroidImportance.DEFAULT,
    });
    this.canalCriado = true;
  }

  private carregar(): Promise<ModuloDeNotificacoes> {
    this.modulo ??= import('expo-notifications').then((Notificacoes) => {
      // Sem isto, um aviso que chega com o app aberto não aparece na tela.
      Notificacoes.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      return Notificacoes;
    });
    return this.modulo;
  }
}

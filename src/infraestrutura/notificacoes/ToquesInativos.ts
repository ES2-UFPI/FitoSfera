import { ToqueNaNotificacao, ToquesNaNotificacao } from '@/aplicacao/portas/ToquesNaNotificacao';

/**
 * O padrão fora do Android (a prévia web e os testes): nenhuma notificação abriu o app e não há toque
 * algum para ouvir. Com ele no lugar, a interface roda igual e simplesmente nunca navega sozinha.
 */
export class ToquesInativos implements ToquesNaNotificacao {
  async toqueQueAbriuOApp(): Promise<ToqueNaNotificacao | null> {
    return null;
  }

  aoTocar(): () => void {
    // Sem notificação nesta plataforma: não há o que ouvir, e cancelar não desfaz nada.
    return () => undefined;
  }
}

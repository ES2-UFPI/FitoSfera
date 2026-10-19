import { Notificador } from '@/dominio/portas/Notificador';

/**
 * O padrão fora do Android (a prévia web e os testes): nunca pede permissão e nunca notifica. Como a
 * permissão nunca é concedida, o caso de uso para antes de avaliar as leituras.
 */
export class NotificadorInativo implements Notificador {
  async garantirPermissao(): Promise<boolean> {
    return false;
  }

  async notificar(): Promise<void> {
    // Sem notificação nesta plataforma: nada a fazer.
  }
}

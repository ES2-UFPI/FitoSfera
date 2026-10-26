import { Notificador } from '@/dominio/portas/Notificador';
import { NotificadorExpo } from '@/infraestrutura/notificacoes/NotificadorExpo';
import { NotificadorInativo } from '@/infraestrutura/notificacoes/NotificadorInativo';

/**
 * O FitoSfera é distribuído só para Android; na prévia web e nos testes não há notificação push, e entra o
 * notificador inativo. Recebe a plataforma em vez de ler o `Platform` para poder ser testado sem React Native.
 */
export function escolherNotificador(plataforma: string): Notificador {
  return plataforma === 'android' ? new NotificadorExpo() : new NotificadorInativo();
}

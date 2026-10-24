import { ToquesNaNotificacao } from '@/aplicacao/portas/ToquesNaNotificacao';
import { ToquesInativos } from '@/infraestrutura/notificacoes/ToquesInativos';
import { ToquesNaNotificacaoExpo } from '@/infraestrutura/notificacoes/ToquesNaNotificacaoExpo';

/**
 * O FitoSfera é distribuído só para Android; na prévia web e nos testes não há notificação para tocar, e
 * entram os toques inativos. Recebe a plataforma em vez de ler o `Platform` para poder ser testado sem
 * React Native.
 */
export function escolherToquesNaNotificacao(plataforma: string): ToquesNaNotificacao {
  return plataforma === 'android' ? new ToquesNaNotificacaoExpo() : new ToquesInativos();
}

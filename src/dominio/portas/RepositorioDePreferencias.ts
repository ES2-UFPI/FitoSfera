import { JanelaDeLembretes } from '../modelos/JanelaDeLembretes';

/**
 * As preferências de notificação da pessoa. Quem implementa é um adaptador em `infraestrutura/persistencia/`.
 * Preferência que não dá para ler vale como a padrão: o app nunca fica sem janela.
 */
export interface RepositorioDePreferencias {
  obterJanelaDeLembretes(): Promise<JanelaDeLembretes>;
  definirJanelaDeLembretes(janela: JanelaDeLembretes): Promise<void>;
}

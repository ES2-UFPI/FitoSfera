import {
  ehHorarioDoDia,
  JANELA_PADRAO,
  JanelaDeLembretes,
} from '@/dominio/modelos/JanelaDeLembretes';
import { RepositorioDePreferencias } from '@/dominio/portas/RepositorioDePreferencias';
import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES } from './chaves';

/**
 * Guarda as preferências de notificação num objeto JSON (`fitosfera:v2:preferencias`).
 *
 * Conteúdo ausente ou ilegível vale como a janela padrão, e é sobrescrito na próxima gravação, sem cópia
 * `:ilegivel`: não há dado da pessoa a preservar além da própria preferência, e o pior que acontece é ela
 * voltar ao padrão. Nunca lança: ficar sem janela faria o app notificar de madrugada.
 */
export class RepositorioDePreferenciasAsyncStorage implements RepositorioDePreferencias {
  constructor(private readonly armazenamento: ArmazenamentoChaveValor) {}

  async obterJanelaDeLembretes(): Promise<JanelaDeLembretes> {
    const bruto = await this.armazenamento.getItem(CHAVES.preferencias);
    if (bruto === null) return JANELA_PADRAO;
    try {
      const conteudo: unknown = JSON.parse(bruto);
      if (typeof conteudo !== 'object' || conteudo === null) return JANELA_PADRAO;
      return lerJanela((conteudo as Record<string, unknown>).janelaDeLembretes) ?? JANELA_PADRAO;
    } catch {
      return JANELA_PADRAO;
    }
  }

  async definirJanelaDeLembretes(janela: JanelaDeLembretes): Promise<void> {
    const janelaDeLembretes = {
      inicio: { hora: janela.inicio.hora, minuto: janela.inicio.minuto },
      fim: { hora: janela.fim.hora, minuto: janela.fim.minuto },
    };
    await this.armazenamento.setItem(CHAVES.preferencias, JSON.stringify({ janelaDeLembretes }));
  }
}

/** Janela malformada é lida como ausente: o app cai na padrão em vez de ficar sem horário permitido. */
function lerJanela(bruto: unknown): JanelaDeLembretes | null {
  if (typeof bruto !== 'object' || bruto === null) return null;
  const { inicio, fim } = bruto as Record<string, unknown>;
  if (!ehHorarioDoDia(inicio) || !ehHorarioDoDia(fim)) return null;
  return { inicio, fim };
}

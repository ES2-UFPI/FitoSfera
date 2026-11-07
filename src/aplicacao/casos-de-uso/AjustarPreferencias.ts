import { ehHorarioDoDia, JanelaDeLembretes } from '@/dominio/modelos/JanelaDeLembretes';
import { RepositorioDePreferencias } from '@/dominio/portas/RepositorioDePreferencias';

/**
 * As preferências de notificação vistas pela tela de ajustes: ler a janela gravada e trocá-la.
 *
 * A leitura nunca falha para quem chama — preferência ilegível ou armazenamento fora do ar valem como a
 * janela padrão, igual ao que a verificação periódica assume. A gravação, sim, pode falhar: ali há uma tela
 * para avisar, e dizer que salvou sem ter salvado seria pior.
 */
export class AjustarPreferencias {
  constructor(private readonly preferencias: RepositorioDePreferencias) {}

  obterJanelaDeLembretes(): Promise<JanelaDeLembretes> {
    return this.preferencias.obterJanelaDeLembretes();
  }

  async definirJanelaDeLembretes(janela: JanelaDeLembretes): Promise<void> {
    // O adaptador leria um horário fora da faixa como ausente e cairia no padrão calado. Recusar aqui deixa
    // o erro aparecer em quem chama, em vez de a preferência voltar sozinha ao padrão na próxima abertura.
    if (!ehHorarioDoDia(janela.inicio) || !ehHorarioDoDia(janela.fim)) {
      throw new Error('Horário inválido: a hora vai de 0 a 23 e o minuto, de 0 a 59.');
    }
    // Só hora e minuto seguem adiante, e numa cópia: o que vem da tela não vira o objeto guardado.
    await this.preferencias.definirJanelaDeLembretes({
      inicio: { hora: janela.inicio.hora, minuto: janela.inicio.minuto },
      fim: { hora: janela.fim.hora, minuto: janela.fim.minuto },
    });
  }
}

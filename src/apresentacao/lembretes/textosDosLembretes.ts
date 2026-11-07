import { HorarioDoDia, JanelaDeLembretes } from '@/dominio/modelos/JanelaDeLembretes';

/** `08:00`: sempre dois dígitos, para a hora não dançar na tela quando o número muda de tamanho. */
export function formatarHorario({ hora, minuto }: HorarioDoDia): string {
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
}

/**
 * A janela em uma frase, sem ponto final: quem chama acrescenta o resto. As três formas da janela têm texto
 * próprio, porque "das 22:00 às 07:00" sozinho parece erro de quem escolheu.
 */
export function descreverJanela(janela: JanelaDeLembretes): string {
  const inicio = formatarHorario(janela.inicio);
  const fim = formatarHorario(janela.fim);
  if (inicio === fim) return 'a qualquer hora do dia';
  const atravessaAMeiaNoite = emMinutos(janela.fim) < emMinutos(janela.inicio);
  return atravessaAMeiaNoite ? `das ${inicio} às ${fim}, atravessando a meia-noite` : `das ${inicio} às ${fim}`;
}

function emMinutos({ hora, minuto }: HorarioDoDia): number {
  return hora * 60 + minuto;
}

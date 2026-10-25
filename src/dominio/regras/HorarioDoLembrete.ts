import { HorarioDoDia, JanelaDeLembretes } from '../modelos/JanelaDeLembretes';

const MINUTOS_DO_DIA = 24 * 60;

/**
 * Se o instante cai dentro da janela de lembretes. Os dois limites contam como dentro, como nas faixas
 * recomendadas. Janela com `fim` antes de `inicio` atravessa a meia-noite; `inicio` igual a `fim` é o dia todo.
 */
export function estaNaJanela(janela: JanelaDeLembretes, instante: Date): boolean {
  const inicio = emMinutos(janela.inicio);
  const fim = emMinutos(janela.fim);
  const agora = minutosDoInstante(instante);
  if (inicio === fim) return true;
  // Janela normal: um único trecho do dia. Atravessando a meia-noite, são dois trechos, e basta um deles.
  return inicio < fim ? agora >= inicio && agora <= fim : agora >= inicio || agora <= fim;
}

/**
 * Quando o app poderá notificar: o próprio instante, se a janela já está aberta, ou a próxima abertura dela.
 * É o horário que um aviso detectado de madrugada espera.
 */
export function proximoHorarioPermitido(janela: JanelaDeLembretes, instante: Date): Date {
  if (estaNaJanela(janela, instante)) return instante;
  const aberturaDeHoje = comHorario(instante, janela.inicio);
  // Fora da janela e antes da abertura de hoje: a espera acaba hoje. Depois dela, só amanhã.
  if (aberturaDeHoje.getTime() > instante.getTime()) return aberturaDeHoje;
  const amanha = new Date(aberturaDeHoje);
  amanha.setDate(amanha.getDate() + 1);
  return amanha;
}

function emMinutos({ hora, minuto }: HorarioDoDia): number {
  return (hora * 60 + minuto) % MINUTOS_DO_DIA;
}

function minutosDoInstante(instante: Date): number {
  return instante.getHours() * 60 + instante.getMinutes();
}

/** O mesmo dia do instante, na hora pedida, zerando segundos: a janela tem resolução de minuto. */
function comHorario(instante: Date, horario: HorarioDoDia): Date {
  return new Date(
    instante.getFullYear(),
    instante.getMonth(),
    instante.getDate(),
    horario.hora,
    horario.minuto,
    0,
    0,
  );
}

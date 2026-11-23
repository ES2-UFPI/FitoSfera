import { periodoEscondeLuz } from './LuzDoDia';
import { MarcaDoContadorDeLuz, PeriodoDeLuz } from './LuzRecebida';

/** A hora em que o sol forjado começa. */
export const HORA_DO_SOL_FORJADO = 7;
/** Os períodos forjados têm o tamanho de um ciclo do sensor físico. */
export const PASSO_DO_SOL_FORJADO_MS = 5 * 60_000;

/** Períodos de sol constante, de `inicio` a `fim`, em passos de 5 minutos. */
export function forjarSol(inicio: Date, fim: Date, lux: number): PeriodoDeLuz[] {
  const periodos: PeriodoDeLuz[] = [];
  for (let instante = inicio.getTime(); instante < fim.getTime(); instante += PASSO_DO_SOL_FORJADO_MS) {
    const fimDoPasso = Math.min(instante + PASSO_DO_SOL_FORJADO_MS, fim.getTime());
    periodos.push({
      luxMinutos: (lux * (fimDoPasso - instante)) / 60_000,
      inicio: new Date(instante),
      fim: new Date(fimDoPasso),
      incompleta: false,
    });
  }
  return periodos;
}

export type SolDaDemonstracao =
  | { readonly preenchido: true; readonly periodos: readonly PeriodoDeLuz[] }
  | { readonly preenchido: false; readonly motivo: 'sem-leitura-hoje' | 'antes-das-7h' | 'ja-preenchido' };

/**
 * Para apresentar o app com o sensor de verdade ligado depois das 7h: forja sol das 7h até o ponto em que a luz
 * medida pelo sensor começa hoje, e mantém a luz medida dali em diante. A marca do contador não muda, então o
 * próximo pacote do sensor continua a conta como sempre.
 *
 * A luz medida é a sequência de períodos completos e encadeados que termina na marca: cada período começa onde o
 * anterior terminou. Ela para num reinício do sensor que escondeu luz (período incompleto longo), num buraco da
 * sequência ou às 7h. Um reinício rápido não interrompe a luz medida. Os
 * períodos incompletos de hoje saem, para o cartão não acusar o dia como incompleto.
 */
export function preencherSolDesdeAs7h({
  marca,
  periodos,
  agora,
  lux,
}: {
  marca: MarcaDoContadorDeLuz | null;
  periodos: readonly PeriodoDeLuz[];
  agora: Date;
  lux: number;
}): SolDaDemonstracao {
  const inicioDoDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();
  const as7h = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), HORA_DO_SOL_FORJADO).getTime();
  if (marca === null || marca.medidaEm.getTime() < inicioDoDia || marca.medidaEm.getTime() > agora.getTime()) {
    return { preenchido: false, motivo: 'sem-leitura-hoje' };
  }
  if (marca.medidaEm.getTime() <= as7h) return { preenchido: false, motivo: 'antes-das-7h' };

  const ordenados = [...periodos].sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  let inicioDaLuzMedida = marca.medidaEm.getTime();
  let primeiroMedido = ordenados.length;
  for (let indice = ordenados.length - 1; indice >= 0; indice -= 1) {
    const periodo = ordenados[indice];
    if (periodoEscondeLuz(periodo) || periodo.fim.getTime() !== inicioDaLuzMedida || periodo.inicio.getTime() < as7h) break;
    inicioDaLuzMedida = periodo.inicio.getTime();
    primeiroMedido = indice;
  }
  if (inicioDaLuzMedida <= as7h) return { preenchido: false, motivo: 'ja-preenchido' };

  const anteriores = ordenados
    .slice(0, primeiroMedido)
    .filter((periodo) => periodo.fim.getTime() <= as7h && !(periodo.incompleta && periodo.fim.getTime() > inicioDoDia));
  return {
    preenchido: true,
    periodos: [
      ...anteriores,
      ...forjarSol(new Date(as7h), new Date(inicioDaLuzMedida), lux),
      ...ordenados.slice(primeiroMedido),
    ],
  };
}

import { TEXTOS } from '@/textos';

const { cabecalho } = TEXTOS;

export type Saudacao = (typeof cabecalho)['bomDia' | 'boaTarde' | 'boaNoite'];

export function saudacaoPara(data: Date): Saudacao {
  const hora = data.getHours();
  if (hora >= 5 && hora < 12) return cabecalho.bomDia;
  if (hora >= 12 && hora < 18) return cabecalho.boaTarde;
  return cabecalho.boaNoite;
}

// Nomes escritos à mão no módulo de textos: o motor JavaScript do app nem sempre traz Intl completo.
export function dataPorExtenso(data: Date): string {
  return cabecalho.dataPorExtenso(cabecalho.diasDaSemana[data.getDay()], data.getDate(), cabecalho.meses[data.getMonth()]);
}

export function descreverQuantidade(quantidade: number): string {
  if (quantidade === 0) return cabecalho.semPlantas;
  return cabecalho.plantasNaEstante(quantidade);
}

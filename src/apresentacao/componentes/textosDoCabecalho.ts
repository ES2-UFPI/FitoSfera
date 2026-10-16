// Nomes escritos à mão: o motor JavaScript do app nem sempre traz Intl completo.
const DIAS = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
const MESES = [
  'JANEIRO',
  'FEVEREIRO',
  'MARÇO',
  'ABRIL',
  'MAIO',
  'JUNHO',
  'JULHO',
  'AGOSTO',
  'SETEMBRO',
  'OUTUBRO',
  'NOVEMBRO',
  'DEZEMBRO',
];

export type Saudacao = 'Bom dia' | 'Boa tarde' | 'Boa noite';

export function saudacaoPara(data: Date): Saudacao {
  const hora = data.getHours();
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function dataPorExtenso(data: Date): string {
  return `${DIAS[data.getDay()]} · ${data.getDate()} DE ${MESES[data.getMonth()]}`;
}

export function descreverQuantidade(quantidade: number): string {
  if (quantidade === 0) return 'Ainda sem plantas por aqui';
  return `${quantidade} ${quantidade === 1 ? 'planta' : 'plantas'} na sua estante`;
}

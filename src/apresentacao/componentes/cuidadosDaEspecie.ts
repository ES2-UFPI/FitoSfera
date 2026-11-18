import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { formatarNumero, TEXTOS } from '@/textos';

interface Faixa {
  readonly minimo: number;
  readonly maximo: number;
}

/** A frequência de rega em palavras: "todo dia" e "uma vez por semana" se leem melhor que "a cada 1 dia". */
export function textoDaRega(intervaloEmDias: number): string {
  if (intervaloEmDias <= 1) return TEXTOS.cuidados.regarTodoDia;
  if (intervaloEmDias === 7) return TEXTOS.cuidados.regarUmaVezPorSemana;
  if (intervaloEmDias === 14) return TEXTOS.cuidados.regarACadaDuasSemanas;
  return TEXTOS.cuidados.regarACada(intervaloEmDias);
}

/**
 * A exposição ao sol pela luz do dia da espécie (DLI, em mol/m²). O catálogo usa os quatro níveis da tabela da
 * Iowa State University: baixa (a partir de 3), média (6), alta (12) e muito alta (18). As horas de sol direto são
 * a leitura usual de "sol parcial" e "sol pleno" nos guias de jardinagem, uma aproximação para quem não mede luz.
 */
export function textoDaLuz(luzDiaria: Faixa): string {
  const { minimo } = luzDiaria;
  if (minimo >= 18) return TEXTOS.cuidados.luz.muitoAlta;
  if (minimo >= 12) return TEXTOS.cuidados.luz.alta;
  if (minimo >= 6) return TEXTOS.cuidados.luz.media;
  return TEXTOS.cuidados.luz.baixa;
}

export function textoDaTemperatura(temperatura: Faixa): string {
  return TEXTOS.cuidados.temperatura(formatarNumero(temperatura.minimo), formatarNumero(temperatura.maximo));
}

export type IconeDoCuidado = 'rega' | 'luz' | 'temperatura';

export interface CuidadosDaEspecie {
  readonly itens: readonly { readonly icone: IconeDoCuidado; readonly texto: string }[];
  /** Os itens numa frase só, para o leitor de tela, com "graus Celsius" no lugar de "°C". */
  readonly falado: string;
}

/** Os cuidados do dia a dia da espécie. Sem faixas no catálogo, sobra só a rega. */
export function cuidadosDaEspecie(especie: EspecieVegetal): CuidadosDaEspecie {
  const rega = textoDaRega(especie.intervaloDeRegaEmDias);
  const faixas = especie.faixasIdeais;
  if (faixas === null) return { itens: [{ icone: 'rega', texto: rega }], falado: `${rega}.` };

  const luz = textoDaLuz(faixas.luzDiaria);
  const temperatura = textoDaTemperatura(faixas.temperatura);
  const temperaturaFalada = TEXTOS.cuidados.temperaturaFalada(
    formatarNumero(faixas.temperatura.minimo),
    formatarNumero(faixas.temperatura.maximo),
  );
  return {
    itens: [
      { icone: 'rega', texto: rega },
      { icone: 'luz', texto: luz },
      { icone: 'temperatura', texto: temperatura },
    ],
    falado: `${rega}. ${luz}. ${temperaturaFalada}.`,
  };
}

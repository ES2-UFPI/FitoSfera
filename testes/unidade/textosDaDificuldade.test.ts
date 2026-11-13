import { NIVEIS_DE_DIFICULDADE } from '@/dominio/modelos/EspecieVegetal';
import { ExigenciasDeManejo } from '@/dominio/modelos/ExigenciasDeManejo';
import { CriteriosDeDificuldade, MOTIVOS_DA_DIFICULDADE } from '@/dominio/regras/ClassificadorDeDificuldade';
import { CORES } from '@/apresentacao/tema';
import { especieDeTeste } from '../apoio/especiesDeTeste';
import {
  APRESENTACAO_DA_DIFICULDADE,
  observacaoDaDificuldade,
  TEXTO_DO_MOTIVO,
} from '@/apresentacao/componentes/textosDaDificuldade';

const FONTE = 'Fonte de teste';
const base = especieDeTeste({ id: 'x', nomeComum: 'X', nomeCientifico: 'X x', nomesAlternativos: [] });

/** `luzDiaria` é o mínimo da faixa de DLI, em mol/m²/dia: 18 é luz muito alta, 12 alta, abaixo é sombra. */
function criterios(dados: {
  rega: number;
  luzDiaria?: number;
  exigencias?: ExigenciasDeManejo | null;
}): CriteriosDeDificuldade {
  return {
    intervaloDeRegaEmDias: dados.rega,
    faixasIdeais: {
      ...base.faixasIdeais!,
      luzDiaria: { minimo: dados.luzDiaria ?? 6, maximo: 30, fonte: FONTE },
    },
    exigencias: dados.exigencias ?? null,
  };
}

const fato = (presente: boolean) => ({ presente, fonte: FONTE });

describe('TEXTO_DO_MOTIVO', () => {
  test('tem texto para todo motivo que o domínio sabe apontar', () => {
    expect(Object.keys(TEXTO_DO_MOTIVO).sort()).toEqual([...MOTIVOS_DA_DIFICULDADE].sort());
  });

  test('nenhum texto está em branco: motivo sem frase deixaria a observação truncada', () => {
    expect(Object.values(TEXTO_DO_MOTIVO).filter((texto) => texto.trim() === '')).toEqual([]);
  });
});

/** Contraste pela fórmula da WCAG, para o teste cobrar os 4,5:1 de texto pequeno. */
function contraste(umaCor: string, outraCor: string): number {
  const luminancia = (cor: string) => {
    const canais = [1, 3, 5].map((inicio) => parseInt(cor.slice(inicio, inicio + 2), 16) / 255);
    const [r, g, b] = canais.map((canal) => (canal <= 0.03928 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [claro, escuro] = [luminancia(umaCor), luminancia(outraCor)].sort((a, b) => b - a);
  return (claro + 0.05) / (escuro + 0.05);
}

describe('APRESENTACAO_DA_DIFICULDADE', () => {
  test('cobre os três níveis do domínio', () => {
    expect(Object.keys(APRESENTACAO_DA_DIFICULDADE).sort()).toEqual([...NIVEIS_DE_DIFICULDADE].sort());
  });

  test('dá uma cor diferente para cada nível, para o selo não depender só do texto', () => {
    const cores = Object.values(APRESENTACAO_DA_DIFICULDADE).map((item) => item.cor);
    expect(new Set(cores).size).toBe(cores.length);
  });

  test('dá um fundo e uma borda diferentes para cada nível, para o cartão dizer o nível pela cor', () => {
    const fundos = Object.values(APRESENTACAO_DA_DIFICULDADE).map((item) => item.fundo);
    const bordas = Object.values(APRESENTACAO_DA_DIFICULDADE).map((item) => item.borda);
    expect(new Set(fundos).size).toBe(fundos.length);
    expect(new Set(bordas).size).toBe(bordas.length);
  });

  test('o texto do cartão alcança 4,5:1 sobre o fundo de qualquer nível', () => {
    const reprovados = Object.entries(APRESENTACAO_DA_DIFICULDADE)
      .filter(([, item]) => contraste(item.fundo, CORES.texto) < 4.5)
      .map(([nivel]) => nivel);
    expect(reprovados).toEqual([]);
  });

  test('o selo colorido é que não serve sobre o fundo do próprio nível: é por isso que o cartão não o usa', () => {
    // Guarda a decisão de desenho: se algum dia os tons mudarem e a cor passar a servir, este teste avisa.
    const comContrasteDeSobra = Object.entries(APRESENTACAO_DA_DIFICULDADE)
      .filter(([, item]) => contraste(item.fundo, item.cor) >= 4.5)
      .map(([nivel]) => nivel);
    expect(comContrasteDeSobra).toEqual(['dificil']);
  });
});

describe('observacaoDaDificuldade', () => {
  test('não escreve nada em espécie fácil: não há o que justificar', () => {
    expect(observacaoDaDificuldade('facil', criterios({ rega: 1, luzDiaria: 18 }))).toBeNull();
  });

  test('traz um item para o único motivo, e a frase para o leitor de tela', () => {
    expect(observacaoDaDificuldade('medio', criterios({ rega: 4 }))).toEqual({
      itens: ['Necessita de rega frequente'],
      falado: 'Médio: Necessita de rega frequente.',
    });
  });

  test('um item por motivo, na ordem em que o domínio aponta', () => {
    expect(observacaoDaDificuldade('dificil', criterios({ rega: 2, luzDiaria: 18 }))).toEqual({
      itens: ['Necessita de rega frequente', 'Necessita de sol pleno'],
      falado: 'Exigente: Necessita de rega frequente. Necessita de sol pleno.',
    });
  });

  test('com ficha de manejo, acrescenta um item por fato pesquisado', () => {
    const exigencias: ExigenciasDeManejo = {
      exigeControleDePraga: fato(true),
      morreComEncharcamento: fato(true),
      exigeManejoEstrutural: fato(true),
    };
    const observacao = observacaoDaDificuldade('dificil', criterios({ rega: 1, luzDiaria: 18, exigencias }));
    expect(observacao?.itens).toEqual([
      'Necessita de rega frequente',
      'Necessita de sol pleno',
      'Necessita de controle de praga',
      'Cuidado com encharcamento. A planta morre se encharcar',
      'Necessita de poda ou tutor',
    ]);
  });

  test('nenhum item termina em ponto: o ponto é só da frase falada', () => {
    const exigencias: ExigenciasDeManejo = {
      exigeControleDePraga: fato(true),
      morreComEncharcamento: fato(true),
      exigeManejoEstrutural: fato(true),
    };
    const observacao = observacaoDaDificuldade('dificil', criterios({ rega: 1, luzDiaria: 18, exigencias }));
    expect(observacao?.itens.filter((item) => item.endsWith('.'))).toEqual([]);
  });

  test('sem ficha, não inventa motivo de manejo', () => {
    const observacao = observacaoDaDificuldade('dificil', criterios({ rega: 1, luzDiaria: 18 }));
    expect(observacao?.itens).toEqual(['Necessita de rega frequente', 'Necessita de sol pleno']);
  });

  test('sem motivo nenhum, admite que o catálogo não detalha, em vez de ficar sem lista', () => {
    // É o caso da orquídea: rega de 7 dias e DLI de 6 a 10, difícil por cuidados que o catálogo não mede.
    expect(observacaoDaDificuldade('dificil', criterios({ rega: 7, luzDiaria: 6 }))).toEqual({
      itens: ['Exige cuidados que o catálogo ainda não detalha'],
      falado: 'Exigente: Exige cuidados que o catálogo ainda não detalha.',
    });
  });
});

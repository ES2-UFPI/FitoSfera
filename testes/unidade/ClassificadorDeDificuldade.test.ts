import { ExigenciasDeManejo } from '@/dominio/modelos/ExigenciasDeManejo';
import {
  classificarDificuldade,
  CriteriosDeDificuldade,
  motivosDaDificuldade,
} from '@/dominio/regras/ClassificadorDeDificuldade';
import { especieDeTeste } from '../apoio/especiesDeTeste';

const FONTE = 'Fonte de teste';

function exigencias(praga: boolean, encharcamento: boolean, manejo: boolean): ExigenciasDeManejo {
  return {
    exigeControleDePraga: { presente: praga, fonte: FONTE },
    morreComEncharcamento: { presente: encharcamento, fonte: FONTE },
    exigeManejoEstrutural: { presente: manejo, fonte: FONTE },
  };
}

const base = especieDeTeste({ id: 'x', nomeComum: 'X', nomeCientifico: 'X x', nomesAlternativos: [] });

function criterios(dados: {
  rega: number;
  luzMinima?: number;
  praga?: boolean;
  encharcamento?: boolean;
  manejo?: boolean;
}): CriteriosDeDificuldade {
  return {
    intervaloDeRegaEmDias: dados.rega,
    faixasIdeais: {
      ...base.faixasIdeais!,
      luminosidade: { minimo: dados.luzMinima ?? 500, maximo: 80000, fonte: FONTE },
    },
    exigencias: exigencias(dados.praga ?? false, dados.encharcamento ?? false, dados.manejo ?? false),
  };
}

describe('classificarDificuldade', () => {
  test('rega frequente, sol pleno e os três fatos de manejo dão difícil', () => {
    const especie = criterios({ rega: 1, luzMinima: 30000, praga: true, encharcamento: true, manejo: true });
    expect(classificarDificuldade(especie)).toBe('dificil');
  });

  test('rega espaçada, meia-sombra e nenhum fato de manejo dão fácil', () => {
    expect(classificarDificuldade(criterios({ rega: 14, luzMinima: 500 }))).toBe('facil');
  });

  test('rega de rotina e meia-sombra, sem fato de manejo, dão médio', () => {
    // 2 (rega) + 1 (luz) + 0 = 3... um fato de manejo leva ao corte de 4.
    expect(classificarDificuldade(criterios({ rega: 2, luzMinima: 5000, encharcamento: true }))).toBe('medio');
  });

  test('o tomate do catálogo cai em difícil', () => {
    // rega 1 dia (2) + luz mínima 25000 (2) + praga e manejo estrutural (2) = 6 pontos.
    const tomate = criterios({ rega: 1, luzMinima: 25000, praga: true, manejo: true });
    expect(classificarDificuldade(tomate)).toBe('dificil');
  });

  test('a jiboia do catálogo cai em fácil', () => {
    // rega 7 dias (0) + luz mínima 500 (0) + só encharcamento (1) = 1 ponto.
    expect(classificarDificuldade(criterios({ rega: 7, luzMinima: 500, encharcamento: true }))).toBe('facil');
  });

  test('espécie sem faixas não é penalizada pela falta de dado', () => {
    const semFaixas: CriteriosDeDificuldade = {
      intervaloDeRegaEmDias: 10,
      faixasIdeais: null,
      exigencias: exigencias(false, false, false),
    };
    expect(classificarDificuldade(semFaixas)).toBe('facil');
  });

  test('cada fato de manejo vale um ponto e nenhum deles decide sozinho', () => {
    const soPraga = criterios({ rega: 14, praga: true });
    const soEncharcamento = criterios({ rega: 14, encharcamento: true });
    const soManejo = criterios({ rega: 14, manejo: true });
    expect([soPraga, soEncharcamento, soManejo].map(classificarDificuldade)).toEqual([
      'facil',
      'facil',
      'facil',
    ]);
  });
});

describe('motivosDaDificuldade', () => {
  test('lista só o que de fato pesou, na ordem em que a tela mostra', () => {
    const especie = criterios({ rega: 2, luzMinima: 30000, praga: true, manejo: true });
    expect(motivosDaDificuldade(especie)).toEqual([
      'rega-frequente',
      'sol-pleno',
      'controle-de-praga',
      'manejo-estrutural',
    ]);
  });

  test('espécie tranquila não tem motivo nenhum', () => {
    expect(motivosDaDificuldade(criterios({ rega: 14, luzMinima: 500 }))).toEqual([]);
  });
});

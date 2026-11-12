import { ExigenciasDeManejo } from '@/dominio/modelos/ExigenciasDeManejo';
import {
  classificarDificuldade,
  CriteriosDeDificuldade,
  LIMITES,
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

/** `luzDiaria` é o mínimo da faixa de DLI, em mol/m²/dia: 18 é luz muito alta, 12 alta, abaixo é sombra. */
function criterios(dados: {
  rega: number;
  luzDiaria?: number;
  praga?: boolean;
  encharcamento?: boolean;
  manejo?: boolean;
}): CriteriosDeDificuldade {
  return {
    intervaloDeRegaEmDias: dados.rega,
    faixasIdeais: {
      ...base.faixasIdeais!,
      luzDiaria: { minimo: dados.luzDiaria ?? 3, maximo: 30, fonte: FONTE },
    },
    exigencias: exigencias(dados.praga ?? false, dados.encharcamento ?? false, dados.manejo ?? false),
  };
}

describe('classificarDificuldade', () => {
  test('rega frequente, sol pleno e os três fatos de manejo dão difícil', () => {
    const especie = criterios({ rega: 1, luzDiaria: 18, praga: true, encharcamento: true, manejo: true });
    expect(classificarDificuldade(especie)).toBe('dificil');
  });

  test('rega espaçada, sombra e nenhum fato de manejo dão fácil', () => {
    expect(classificarDificuldade(criterios({ rega: 14, luzDiaria: 3 }))).toBe('facil');
  });

  test('rega de rotina e luz alta, sem fato de manejo, dão médio', () => {
    // 2 (rega) + 1 (luz alta) + 0 = 3... um fato de manejo leva ao corte de 4.
    expect(classificarDificuldade(criterios({ rega: 2, luzDiaria: 12, encharcamento: true }))).toBe('medio');
  });

  test('o tomate do catálogo cai em difícil', () => {
    // rega 1 dia (2) + DLI de 18 a 30 (2) + praga e manejo estrutural (2) = 6 pontos.
    const tomate = criterios({ rega: 1, luzDiaria: 18, praga: true, manejo: true });
    expect(classificarDificuldade(tomate)).toBe('dificil');
  });

  test('a jiboia do catálogo cai em fácil', () => {
    // rega 7 dias (0) + DLI de 3 a 6 (0) + só encharcamento (1) = 1 ponto.
    expect(classificarDificuldade(criterios({ rega: 7, luzDiaria: 3, encharcamento: true }))).toBe('facil');
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

describe('o critério da luz diária', () => {
  const { luzDiariaMuitoAlta, luzDiariaAlta } = LIMITES;
  const nivelCom = (luzDiaria: number, rega = 14) => classificarDificuldade(criterios({ rega, luzDiaria, praga: true, encharcamento: true, manejo: true }));

  test('luz muito alta pesa 2, e com os três fatos de manejo já dá difícil', () => {
    // 0 (rega espaçada) + 2 (luz) + 3 (manejo) = 5, o corte de difícil.
    expect(nivelCom(luzDiariaMuitoAlta)).toBe('dificil');
  });

  test('luz alta pesa 1: os mesmos três fatos param em médio', () => {
    // 0 + 1 + 3 = 4.
    expect(nivelCom(luzDiariaAlta)).toBe('medio');
    expect(nivelCom(luzDiariaMuitoAlta - 1)).toBe('medio');
  });

  test('sombra não pesa: dar pouca luz dentro de casa é fácil', () => {
    // 0 + 0 + 3 = 3.
    expect(nivelCom(luzDiariaAlta - 1)).toBe('facil');
    expect(nivelCom(3)).toBe('facil');
  });

  test('é a luz somada no dia que conta, não o lux de um instante', () => {
    // Duas espécies de sol forte num instante, uma com dia curto de luz e outra com dia longo.
    const diaCurto = criterios({ rega: 14, luzDiaria: 6 });
    const diaLongo = criterios({ rega: 14, luzDiaria: luzDiariaMuitoAlta });
    expect(motivosDaDificuldade(diaCurto)).toEqual([]);
    expect(motivosDaDificuldade(diaLongo)).toEqual(['sol-pleno']);
  });
});

describe('motivosDaDificuldade', () => {
  test('lista só o que de fato pesou, na ordem em que a tela mostra', () => {
    const especie = criterios({ rega: 2, luzDiaria: 18, praga: true, manejo: true });
    expect(motivosDaDificuldade(especie)).toEqual([
      'rega-frequente',
      'sol-pleno',
      'controle-de-praga',
      'manejo-estrutural',
    ]);
  });

  test('espécie tranquila não tem motivo nenhum', () => {
    expect(motivosDaDificuldade(criterios({ rega: 14, luzDiaria: 3 }))).toEqual([]);
  });
});

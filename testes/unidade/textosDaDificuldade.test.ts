import { NIVEIS_DE_DIFICULDADE } from '@/dominio/modelos/EspecieVegetal';
import { ExigenciasDeManejo } from '@/dominio/modelos/ExigenciasDeManejo';
import { CriteriosParaMotivos, MOTIVOS_DA_DIFICULDADE } from '@/dominio/regras/ClassificadorDeDificuldade';
import {
  APRESENTACAO_DA_DIFICULDADE,
  observacaoDaDificuldade,
  TEXTO_DO_MOTIVO,
} from '@/apresentacao/cadastro/textosDaDificuldade';

const FONTE = 'Fonte de teste';
const faixa = (minimo: number, maximo: number) => ({ minimo, maximo, fonte: FONTE });

function criterios(dados: {
  rega: number;
  luzMinima?: number;
  exigencias?: ExigenciasDeManejo | null;
}): CriteriosParaMotivos {
  return {
    intervaloDeRegaEmDias: dados.rega,
    faixasIdeais: {
      umidadeDoAr: faixa(50, 80),
      temperatura: faixa(18, 28),
      luminosidade: faixa(dados.luzMinima ?? 5000, 50000),
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

describe('APRESENTACAO_DA_DIFICULDADE', () => {
  test('cobre os três níveis do domínio', () => {
    expect(Object.keys(APRESENTACAO_DA_DIFICULDADE).sort()).toEqual([...NIVEIS_DE_DIFICULDADE].sort());
  });

  test('dá uma cor diferente para cada nível, para o selo não depender só do texto', () => {
    const cores = Object.values(APRESENTACAO_DA_DIFICULDADE).map((item) => item.cor);
    expect(new Set(cores).size).toBe(cores.length);
  });
});

describe('observacaoDaDificuldade', () => {
  test('não escreve nada em espécie fácil: não há o que justificar', () => {
    expect(observacaoDaDificuldade('facil', criterios({ rega: 1, luzMinima: 30000 }))).toBeNull();
  });

  test('cita a rega quando ela é o único motivo', () => {
    expect(observacaoDaDificuldade('medio', criterios({ rega: 4 }))).toBe('Médio: rega frequente.');
  });

  test('junta dois motivos com "e"', () => {
    expect(observacaoDaDificuldade('dificil', criterios({ rega: 2, luzMinima: 25000 }))).toBe(
      'Difícil: rega frequente e precisa de sol pleno.',
    );
  });

  test('com ficha de manejo, lista também os fatos pesquisados, com vírgula e "e" no fim', () => {
    const exigencias: ExigenciasDeManejo = {
      exigeControleDePraga: fato(true),
      morreComEncharcamento: fato(true),
      exigeManejoEstrutural: fato(true),
    };
    expect(observacaoDaDificuldade('dificil', criterios({ rega: 1, luzMinima: 25000, exigencias }))).toBe(
      'Difícil: rega frequente, precisa de sol pleno, pede controle de praga, morre se encharcar e pede poda ou tutor.',
    );
  });

  test('sem ficha, não inventa motivo de manejo', () => {
    const observacao = observacaoDaDificuldade('dificil', criterios({ rega: 1, luzMinima: 25000 }));
    expect(observacao).not.toContain('praga');
    expect(observacao).not.toContain('poda');
  });

  test('sem motivo nenhum, admite que o catálogo não detalha, em vez de ficar em branco', () => {
    // É o caso da orquídea: rega de 7 dias e meia-sombra, difícil por cuidados que o catálogo não mede.
    expect(observacaoDaDificuldade('dificil', criterios({ rega: 7, luzMinima: 5000 }))).toBe(
      'Difícil: exige cuidados que o catálogo ainda não detalha.',
    );
  });
});

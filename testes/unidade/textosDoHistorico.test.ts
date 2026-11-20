import {
  descreverProximaRega,
  descreverQuandoRegou,
  descreverTempoDesdeOPlantio,
  descreverTempoNoJardim,
} from '@/apresentacao/componentes/textosDoHistorico';
import { SituacaoDaRega } from '@/dominio/regras/ProximaRega';

describe('descreverQuandoRegou', () => {
  test('os dois dias mais recentes têm nome próprio, em vez de "há 0 dias"', () => {
    expect(descreverQuandoRegou(0)).toBe('hoje');
    expect(descreverQuandoRegou(1)).toBe('ontem');
  });

  test('daí em diante conta os dias', () => {
    expect(descreverQuandoRegou(2)).toBe('há 2 dias');
    expect(descreverQuandoRegou(10)).toBe('há 10 dias');
  });
});

/** Uma situação com o prazo pedido, montada como a `situacaoDaRega` monta: regar a partir do dia do prazo. */
function situacaoCom(diasAteAProxima: number): SituacaoDaRega {
  return { proximaEm: new Date(2026, 9, 7), diasAteAProxima, precisaRegar: diasAteAProxima <= 0 };
}

describe('descreverProximaRega', () => {
  test('sem prazo para anunciar, não devolve texto nenhum', () => {
    expect(
      descreverProximaRega({ proximaEm: null, diasAteAProxima: null, precisaRegar: false }),
    ).toBeUndefined();
  });

  test('a rega vencida é anunciada como atrasada, com o plural certo', () => {
    expect(descreverProximaRega(situacaoCom(-1))).toBe('atrasada há 1 dia');
    expect(descreverProximaRega(situacaoCom(-3))).toBe('atrasada há 3 dias');
  });

  test('hoje e amanhã têm nome próprio; o resto conta os dias', () => {
    expect(descreverProximaRega(situacaoCom(0))).toBe('é hoje');
    expect(descreverProximaRega(situacaoCom(1))).toBe('é amanhã');
    expect(descreverProximaRega(situacaoCom(4))).toBe('em 4 dias');
  });
});

describe('descreverTempoNoJardim', () => {
  test('quem chegou hoje não fica com "há 0 dias no jardim"', () => {
    expect(descreverTempoNoJardim(0)).toBe('chegou hoje');
  });

  test('os demais contam os dias, com o plural certo', () => {
    expect(descreverTempoNoJardim(1)).toBe('há 1 dia no jardim');
    expect(descreverTempoNoJardim(5)).toBe('há 5 dias no jardim');
  });
});

describe('descreverTempoDesdeOPlantio', () => {
  test('o plantio de hoje tem texto próprio', () => {
    expect(descreverTempoDesdeOPlantio(0)).toBe('plantada hoje');
  });

  test('os demais contam os dias, com o plural certo', () => {
    expect(descreverTempoDesdeOPlantio(1)).toBe('há 1 dia');
    expect(descreverTempoDesdeOPlantio(30)).toBe('há 30 dias');
  });
});

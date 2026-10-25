import { referenciaDaRega, situacaoDaRega } from '@/dominio/regras/ProximaRega';

const agora = new Date(2026, 9, 20, 9, 0);
const cadastradaEm = new Date(2026, 9, 10, 8, 0);

const situacao = (parcial: Partial<Parameters<typeof situacaoDaRega>[0]> = {}) =>
  situacaoDaRega({ ultimaRegaEm: null, cadastradaEm, intervaloEmDias: 3, agora, ...parcial });

describe('a referência de onde o intervalo é contado', () => {
  test('é a última rega quando a planta já foi regada', () => {
    const ultima = new Date(2026, 9, 19, 7, 0);
    expect(referenciaDaRega(ultima, cadastradaEm)).toBe(ultima);
  });

  test('é a data de cadastro quando a planta nunca foi regada', () => {
    expect(referenciaDaRega(null, cadastradaEm)).toBe(cadastradaEm);
  });

  test('é nula quando não há rega nem data de cadastro', () => {
    expect(referenciaDaRega(null, null)).toBeNull();
  });
});

describe('a data da próxima rega', () => {
  test('sai da última rega mais o intervalo da espécie', () => {
    const { proximaEm } = situacao({ ultimaRegaEm: new Date(2026, 9, 19, 7, 0) });
    expect(proximaEm).toEqual(new Date(2026, 9, 22, 7, 0));
  });

  test('sem rega registrada, sai da data de cadastro', () => {
    expect(situacao({ ultimaRegaEm: null }).proximaEm).toEqual(new Date(2026, 9, 13, 8, 0));
  });

  test('mantém a hora do dia da referência', () => {
    const { proximaEm } = situacao({ ultimaRegaEm: new Date(2026, 9, 18, 22, 45), intervaloEmDias: 7 });
    expect(proximaEm).toEqual(new Date(2026, 9, 25, 22, 45));
  });
});

describe('registrar uma rega adia o lembrete', () => {
  test('a planta vencida para de pedir rega depois de regada', () => {
    const vencida = situacao({ ultimaRegaEm: new Date(2026, 9, 15, 8, 0) });
    expect(vencida.precisaRegar).toBe(true);
    expect(vencida.diasAteAProxima).toBe(-2);

    const regadaAgora = situacao({ ultimaRegaEm: agora });
    expect(regadaAgora.precisaRegar).toBe(false);
    expect(regadaAgora.diasAteAProxima).toBe(3);
    expect(regadaAgora.proximaEm!.getTime()).toBeGreaterThan(vencida.proximaEm!.getTime());
  });

  test('regar de novo adia mais ainda', () => {
    const ontem = situacao({ ultimaRegaEm: new Date(2026, 9, 19, 9, 0) });
    const hoje = situacao({ ultimaRegaEm: agora });
    expect(hoje.diasAteAProxima!).toBeGreaterThan(ontem.diasAteAProxima!);
  });
});

describe('quando o lembrete fica suprimido', () => {
  test('rega recente não pede rega: o prazo ainda não chegou', () => {
    expect(situacao({ ultimaRegaEm: new Date(2026, 9, 19, 9, 0) }).precisaRegar).toBe(false);
    expect(situacao({ ultimaRegaEm: new Date(2026, 9, 18, 9, 0) }).precisaRegar).toBe(false);
  });

  test('no dia do prazo o lembrete vence', () => {
    const noPrazo = situacao({ ultimaRegaEm: new Date(2026, 9, 17, 9, 0) });
    expect(noPrazo.diasAteAProxima).toBe(0);
    expect(noPrazo.precisaRegar).toBe(true);
  });

  test('passado o prazo, continua pedindo e conta o atraso', () => {
    expect(situacao({ ultimaRegaEm: new Date(2026, 9, 14, 9, 0) })).toMatchObject({
      diasAteAProxima: -3,
      precisaRegar: true,
    });
  });

  test('conta por dia de calendário: regada às 23h, o prazo não escorrega', () => {
    const { diasAteAProxima } = situacao({ ultimaRegaEm: new Date(2026, 9, 17, 23, 30), intervaloEmDias: 3 });
    expect(diasAteAProxima).toBe(0);
  });
});

describe('sem dados para calcular, a regra não inventa prazo', () => {
  test('sem intervalo conhecido não há próxima rega nem cobrança', () => {
    expect(situacao({ intervaloEmDias: null })).toEqual({
      proximaEm: null,
      diasAteAProxima: null,
      precisaRegar: false,
    });
  });

  test('planta antiga, sem rega e sem data de cadastro, não é cobrada', () => {
    expect(situacao({ ultimaRegaEm: null, cadastradaEm: null })).toEqual({
      proximaEm: null,
      diasAteAProxima: null,
      precisaRegar: false,
    });
  });

  test('intervalo inválido é tratado como desconhecido, nunca como rega imediata', () => {
    for (const intervaloEmDias of [0, -3, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(situacao({ intervaloEmDias }).precisaRegar).toBe(false);
    }
  });
});

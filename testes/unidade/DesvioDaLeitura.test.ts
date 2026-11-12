import { FaixasRecomendadas } from '@/dominio/modelos/FaixaRecomendada';
import { Leitura } from '@/dominio/modelos/Leitura';
import {
  acompanharDesvios,
  assinaturaDosDesvios,
  chaveDoDesvio,
  detectarDesvios,
  TEMPO_MINIMO_DO_DESVIO_MS,
} from '@/dominio/regras/DesvioDaLeitura';

const FAIXAS: FaixasRecomendadas = {
  umidadeDoAr: { minimo: 40, maximo: 70 },
  temperatura: { minimo: 18, maximo: 28 },
  luminosidade: { minimo: 5000, maximo: 20000 },
};

function leitura(parcial: Partial<Leitura> = {}): Leitura {
  return {
    umidadePercentual: 55,
    temperaturaCelsius: 23,
    luminosidadeLux: 12000,
    medidaEm: new Date(2026, 9, 17, 14, 0),
    ...parcial,
  };
}

describe('detectarDesvios', () => {
  test('leitura dentro da faixa não tem desvio', () => {
    expect(detectarDesvios(leitura(), FAIXAS)).toEqual([]);
  });

  test.each([
    ['umidade no mínimo', { umidadePercentual: 40 }],
    ['umidade no máximo', { umidadePercentual: 70 }],
    ['temperatura no mínimo', { temperaturaCelsius: 18 }],
    ['temperatura no máximo', { temperaturaCelsius: 28 }],
    ['luminosidade no mínimo', { luminosidadeLux: 5000 }],
    ['luminosidade no máximo', { luminosidadeLux: 20000 }],
  ])('%s: valor exatamente no limite está dentro da faixa', (_, medicao) => {
    expect(detectarDesvios(leitura(medicao), FAIXAS)).toEqual([]);
  });

  test.each([
    ['umidade logo abaixo do mínimo', { umidadePercentual: 39.9 }, 'umidadeDoAr', 'abaixo'],
    ['umidade logo acima do máximo', { umidadePercentual: 70.1 }, 'umidadeDoAr', 'acima'],
    ['temperatura logo abaixo do mínimo', { temperaturaCelsius: 17.9 }, 'temperatura', 'abaixo'],
    ['temperatura logo acima do máximo', { temperaturaCelsius: 28.1 }, 'temperatura', 'acima'],
    ['luminosidade logo abaixo do mínimo', { luminosidadeLux: 4999 }, 'luminosidade', 'abaixo'],
    ['luminosidade logo acima do máximo', { luminosidadeLux: 20001 }, 'luminosidade', 'acima'],
  ])('%s: vira um desvio %s %s', (_, medicao, grandeza, sentido) => {
    expect(detectarDesvios(leitura(medicao), FAIXAS)).toEqual([
      { grandeza, sentido, valor: Object.values(medicao)[0], faixa: FAIXAS[grandeza as 'temperatura'] },
    ]);
  });

  test('várias grandezas fora da faixa viram vários desvios, na ordem das grandezas', () => {
    const desvios = detectarDesvios(leitura({ umidadePercentual: 30, luminosidadeLux: 25000 }), FAIXAS);
    expect(desvios.map((desvio) => [desvio.grandeza, desvio.sentido])).toEqual([
      ['umidadeDoAr', 'abaixo'],
      ['luminosidade', 'acima'],
    ]);
  });
});

describe('assinaturaDosDesvios', () => {
  const assinaturaDe = (parcial: Partial<Leitura>) => assinaturaDosDesvios(detectarDesvios(leitura(parcial), FAIXAS));

  test('leitura dentro da faixa tem assinatura vazia', () => {
    expect(assinaturaDe({})).toBe('');
  });

  test('o mesmo desvio, com outro valor, tem a mesma assinatura', () => {
    expect(assinaturaDe({ temperaturaCelsius: 31 })).toBe(assinaturaDe({ temperaturaCelsius: 35 }));
  });

  test('desvio para o outro lado da faixa tem outra assinatura', () => {
    expect(assinaturaDe({ temperaturaCelsius: 31 })).not.toBe(assinaturaDe({ temperaturaCelsius: 10 }));
  });

  test('uma grandeza a mais fora da faixa tem outra assinatura', () => {
    expect(assinaturaDe({ temperaturaCelsius: 31 })).not.toBe(
      assinaturaDe({ temperaturaCelsius: 31, umidadePercentual: 30 }),
    );
  });
});

test('leitura sem luminosidade não gera desvio de luz, mas mantém os outros', () => {
  expect(detectarDesvios(leitura({ luminosidadeLux: null, umidadePercentual: 30 }), FAIXAS)).toEqual([
    { grandeza: 'umidadeDoAr', sentido: 'abaixo', valor: 30, faixa: FAIXAS.umidadeDoAr },
  ]);
});

describe('faixa do período da leitura (#91)', () => {
  const COM_NOITE: FaixasRecomendadas = {
    ...FAIXAS,
    temperaturaNoturna: { minimo: 13, maximo: 23 },
    umidadeDoArNoturna: { minimo: 40, maximo: 80 },
  };
  const DE_DIA = new Date(2026, 9, 17, 14, 0);
  const DE_NOITE = new Date(2026, 9, 17, 22, 0);

  test('um valor normal para a noite não é desvio à noite, mas é de dia', () => {
    const frio = { temperaturaCelsius: 15, umidadePercentual: 76 };
    expect(detectarDesvios(leitura({ ...frio, medidaEm: DE_NOITE }), COM_NOITE)).toEqual([]);
    expect(assinaturaDosDesvios(detectarDesvios(leitura({ ...frio, medidaEm: DE_DIA }), COM_NOITE))).toBe(
      'umidadeDoAr:acima|temperatura:abaixo',
    );
  });

  test('à noite, a faixa que vale é a da noite, com o seu próprio limite', () => {
    expect(detectarDesvios(leitura({ temperaturaCelsius: 26, medidaEm: DE_NOITE }), COM_NOITE)).toEqual([
      { grandeza: 'temperatura', sentido: 'acima', valor: 26, faixa: COM_NOITE.temperaturaNoturna },
    ]);
  });

  test('escuro à noite não é desvio de luz', () => {
    expect(detectarDesvios(leitura({ luminosidadeLux: 0, medidaEm: DE_NOITE }), COM_NOITE)).toEqual([]);
    expect(detectarDesvios(leitura({ luminosidadeLux: 0, medidaEm: DE_DIA }), COM_NOITE)).toHaveLength(1);
  });

  test('a noite vai das 18h às 6h', () => {
    const escuro = (hora: number) => detectarDesvios(leitura({ luminosidadeLux: 0, medidaEm: new Date(2026, 9, 17, hora) }), COM_NOITE);
    expect(escuro(5)).toEqual([]);
    expect(escuro(6)).toHaveLength(1);
    expect(escuro(17)).toHaveLength(1);
    expect(escuro(18)).toEqual([]);
  });

  test('planta sem as faixas da noite usa as do dia também à noite', () => {
    expect(assinaturaDosDesvios(detectarDesvios(leitura({ temperaturaCelsius: 15, medidaEm: DE_NOITE }), FAIXAS))).toBe(
      'temperatura:abaixo',
    );
  });
});

describe('tempo mínimo do desvio (#91)', () => {
  const INICIO = new Date(2026, 9, 17, 14, 0);
  const depois = (minutos: number) => new Date(INICIO.getTime() + minutos * 60_000);
  const [QUENTE] = detectarDesvios(leitura({ temperaturaCelsius: 31 }), FAIXAS);
  const [SECO] = detectarDesvios(leitura({ umidadePercentual: 30 }), FAIXAS);

  test('o desvio visto pela primeira vez ainda não vira aviso, mas começa a contar', () => {
    const { confirmados, vistosDesde } = acompanharDesvios([QUENTE], new Map(), INICIO);
    expect(confirmados).toEqual([]);
    expect(vistosDesde).toEqual(new Map([[chaveDoDesvio(QUENTE), INICIO]]));
  });

  test('o desvio que continua até o tempo mínimo vira aviso', () => {
    const vistos = new Map([[chaveDoDesvio(QUENTE), INICIO]]);
    expect(TEMPO_MINIMO_DO_DESVIO_MS).toBe(30 * 60_000);
    expect(acompanharDesvios([QUENTE], vistos, depois(29)).confirmados).toEqual([]);
    expect(acompanharDesvios([QUENTE], vistos, depois(30)).confirmados).toEqual([QUENTE]);
  });

  test('o desvio que voltou para a faixa sai da conta e, se voltar, recomeça do zero', () => {
    const vistos = new Map([[chaveDoDesvio(QUENTE), INICIO]]);
    const passou = acompanharDesvios([], vistos, depois(10));
    expect(passou.vistosDesde.size).toBe(0);
    expect(acompanharDesvios([QUENTE], passou.vistosDesde, depois(40)).confirmados).toEqual([]);
  });

  test('cada desvio conta o seu próprio tempo', () => {
    const vistos = new Map([[chaveDoDesvio(QUENTE), INICIO]]);
    const { confirmados, vistosDesde } = acompanharDesvios([SECO, QUENTE], vistos, depois(30));
    expect(confirmados).toEqual([QUENTE]);
    expect(vistosDesde.get(chaveDoDesvio(SECO))).toEqual(depois(30));
  });
});

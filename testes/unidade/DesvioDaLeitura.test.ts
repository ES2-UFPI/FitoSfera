import { FaixasRecomendadas } from '@/dominio/modelos/FaixaRecomendada';
import { Leitura } from '@/dominio/modelos/Leitura';
import { assinaturaDosDesvios, detectarDesvios } from '@/dominio/regras/DesvioDaLeitura';

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

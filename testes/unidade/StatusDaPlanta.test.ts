import { FaixasRecomendadas } from '@/dominio/modelos/FaixaRecomendada';
import { Leitura } from '@/dominio/modelos/Leitura';
import {
  avaliarCondicoes,
  avaliarStatus,
  leituraEstaDesatualizada,
  VALIDADE_DA_LEITURA_MS,
} from '@/dominio/regras/StatusDaPlanta';

const agora = new Date(2026, 9, 17, 14, 0);
const faixas: FaixasRecomendadas = {
  umidadeDoAr: { minimo: 40, maximo: 70 },
  temperatura: { minimo: 18, maximo: 30 },
  luminosidade: { minimo: 5000, maximo: 30000 },
};
const leitura = (parcial: Partial<Leitura> = {}): Leitura => ({
  umidadePercentual: 55,
  temperaturaCelsius: 24,
  luminosidadeLux: 12000,
  medidaEm: new Date(agora.getTime() - 5 * 60_000),
  ...parcial,
});

test('sem leitura a planta fica "sem-dados"', () => {
  expect(avaliarStatus({ leitura: null, faixas, agora })).toBe('sem-dados');
  expect(avaliarCondicoes({ leitura: null, faixas, agora }).situacoes).toBeNull();
});

test('leitura mais velha que a validade fica "sem-dados", nunca "ok"', () => {
  const velha = leitura({ medidaEm: new Date(agora.getTime() - VALIDADE_DA_LEITURA_MS - 1) });
  expect(avaliarStatus({ leitura: velha, faixas, agora })).toBe('sem-dados');
  expect(avaliarCondicoes({ leitura: velha, faixas, agora })).toMatchObject({
    situacoes: null,
    leituraDesatualizada: true,
  });
});

test('leitura exatamente no limite da validade ainda vale', () => {
  const noLimite = leitura({ medidaEm: new Date(agora.getTime() - VALIDADE_DA_LEITURA_MS) });
  expect(avaliarStatus({ leitura: noLimite, faixas, agora })).toBe('ok');
  expect(leituraEstaDesatualizada(noLimite, agora)).toBe(false);
});

test('leitura fica desatualizada um milissegundo depois do limite', () => {
  const antiga = leitura({ medidaEm: new Date(agora.getTime() - VALIDADE_DA_LEITURA_MS - 1) });
  expect(leituraEstaDesatualizada(antiga, agora)).toBe(true);
});

test('a validade é de 30 minutos', () => {
  const vinteENove = leitura({ medidaEm: new Date(agora.getTime() - 29 * 60_000) });
  const trintaEUm = leitura({ medidaEm: new Date(agora.getTime() - 31 * 60_000) });
  expect(avaliarStatus({ leitura: vinteENove, faixas, agora })).toBe('ok');
  expect(avaliarStatus({ leitura: trintaEUm, faixas, agora })).toBe('sem-dados');
});

test('espécie sem faixa recomendada fica "sem-dados"', () => {
  expect(avaliarStatus({ leitura: leitura(), faixas: null, agora })).toBe('sem-dados');
  expect(avaliarCondicoes({ leitura: leitura(), faixas: null, agora }).situacoes).toBeNull();
});

test('leitura recente com tudo dentro da faixa fica "ok", com os limites incluídos', () => {
  expect(avaliarStatus({ leitura: leitura(), faixas, agora })).toBe('ok');
  const nasBordas = leitura({ umidadePercentual: 40, temperaturaCelsius: 30, luminosidadeLux: 5000 });
  expect(avaliarStatus({ leitura: nasBordas, faixas, agora })).toBe('ok');
});

test.each([
  ['umidade abaixo', { umidadePercentual: 39.9 }],
  ['umidade acima', { umidadePercentual: 71 }],
  ['frio', { temperaturaCelsius: 17 }],
  ['calor', { temperaturaCelsius: 31 }],
  ['luz demais', { luminosidadeLux: 30001 }],
])('%s fica "atencao"', (_, fora) => {
  expect(avaliarStatus({ leitura: leitura(fora), faixas, agora })).toBe('atencao');
});

test('pouca luz não tira a planta do "ok": o que conta é o total do dia, mostrado no painel', () => {
  const avaliacao = avaliarCondicoes({ leitura: leitura({ luminosidadeLux: 300 }), faixas, agora });
  expect(avaliacao.status).toBe('ok');
  // O painel continua sabendo que a luz está abaixo, para mostrar.
  expect(avaliacao.situacoes?.luminosidade).toBe('abaixo');
});

test('leitura do futuro (relógio do sensor adiantado) conta como recente', () => {
  const adiantada = leitura({ medidaEm: new Date(agora.getTime() + 2 * 60_000) });
  expect(avaliarStatus({ leitura: adiantada, faixas, agora })).toBe('ok');
});

describe('leitura sem luminosidade (sensor de luz sem resposta)', () => {
  test('com o resto dentro da faixa, fica "ok": a luz só pesaria se estivesse acima do ideal', () => {
    const avaliacao = avaliarCondicoes({ leitura: leitura({ luminosidadeLux: null }), faixas, agora });
    expect(avaliacao.status).toBe('ok');
    expect(avaliacao.situacoes).toEqual({ umidadeDoAr: 'ideal', temperatura: 'ideal', luminosidade: null });
  });

  test('com outra medida fora da faixa, já é "atencao"', () => {
    expect(avaliarStatus({ leitura: leitura({ luminosidadeLux: null, temperaturaCelsius: 35 }), faixas, agora })).toBe(
      'atencao',
    );
  });
});

describe('à noite, vale a régua dos avisos', () => {
  const comNoite: FaixasRecomendadas = {
    ...faixas,
    umidadeDoArNoturna: { minimo: 50, maximo: 85 },
    temperaturaNoturna: { minimo: 12, maximo: 22 },
  };
  const agoraANoite = new Date(2026, 9, 17, 22, 10);
  const leituraANoite = (parcial: Partial<Leitura> = {}): Leitura =>
    leitura({ luminosidadeLux: 0, medidaEm: new Date(2026, 9, 17, 22, 5), ...parcial });

  test('escuro à noite não é falta de luz: a luz fica sem avaliação e a planta pode estar "ok"', () => {
    const avaliacao = avaliarCondicoes({
      leitura: leituraANoite({ temperaturaCelsius: 15, umidadePercentual: 80 }),
      faixas: comNoite,
      agora: agoraANoite,
    });
    expect(avaliacao.status).toBe('ok');
    expect(avaliacao.situacoes).toEqual({ umidadeDoAr: 'ideal', temperatura: 'ideal', luminosidade: null });
  });

  test('temperatura e umidade são comparadas com as faixas da noite', () => {
    const quente = leituraANoite({ temperaturaCelsius: 26 });
    expect(avaliarCondicoes({ leitura: quente, faixas: comNoite, agora: agoraANoite })).toMatchObject({
      status: 'atencao',
      situacoes: { temperatura: 'acima' },
    });
  });

  test('planta sem faixas da noite usa as do dia para temperatura e umidade', () => {
    const fria = leituraANoite({ temperaturaCelsius: 15 });
    expect(avaliarCondicoes({ leitura: fria, faixas, agora: agoraANoite }).situacoes?.temperatura).toBe('abaixo');
  });

  test('o período vem da hora da leitura: uma leitura das 17h50 ainda é do dia', () => {
    const doFimDaTarde = leitura({ luminosidadeLux: 100, medidaEm: new Date(2026, 9, 17, 17, 50) });
    expect(
      avaliarCondicoes({ leitura: doFimDaTarde, faixas: comNoite, agora: new Date(2026, 9, 17, 18, 5) }).situacoes
        ?.luminosidade,
    ).toBe('abaixo');
  });
});

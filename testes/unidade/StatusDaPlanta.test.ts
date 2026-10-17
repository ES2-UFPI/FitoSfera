import { FaixasIdeais } from '@/dominio/modelos/EspecieVegetal';
import { LeituraAmbiental } from '@/dominio/modelos/LeituraAmbiental';
import {
  avaliarStatus,
  leituraEstaDesatualizada,
  VALIDADE_DA_LEITURA_MS,
} from '@/dominio/regras/StatusDaPlanta';

const agora = new Date(2026, 9, 17, 14, 0);
const fonte = 'Fonte de teste';
const faixas: FaixasIdeais = {
  umidadeDoAr: { minimo: 40, maximo: 70, fonte },
  temperatura: { minimo: 18, maximo: 30, fonte },
  luminosidade: { minimo: 5000, maximo: 30000, fonte },
};
const leitura = (parcial: Partial<LeituraAmbiental> = {}): LeituraAmbiental => ({
  umidadePercentual: 55,
  temperaturaCelsius: 24,
  luminosidadeLux: 12000,
  medidaEm: new Date(agora.getTime() - 5 * 60_000),
  ...parcial,
});

test('sem leitura a planta fica "sem-dados"', () => {
  expect(avaliarStatus({ leitura: null, faixas, agora })).toBe('sem-dados');
});

test('leitura mais velha que a validade fica "sem-dados", nunca "ok"', () => {
  const velha = leitura({ medidaEm: new Date(agora.getTime() - VALIDADE_DA_LEITURA_MS - 1) });
  expect(avaliarStatus({ leitura: velha, faixas, agora })).toBe('sem-dados');
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
  ['pouca luz', { luminosidadeLux: 4999 }],
  ['luz demais', { luminosidadeLux: 30001 }],
])('%s fica "atencao"', (_, fora) => {
  expect(avaliarStatus({ leitura: leitura(fora), faixas, agora })).toBe('atencao');
});

test('leitura do futuro (relógio do sensor adiantado) conta como recente', () => {
  const adiantada = leitura({ medidaEm: new Date(agora.getTime() + 2 * 60_000) });
  expect(avaliarStatus({ leitura: adiantada, faixas, agora })).toBe('ok');
});

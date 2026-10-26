import { FaixasRecomendadas } from '@/dominio/modelos/FaixaRecomendada';
import { Leitura } from '@/dominio/modelos/Leitura';
import {
  compararLeituraComFaixas,
  compararMedicaoComFaixa,
  todasAsMedicoesEstaoIdeais,
} from '@/dominio/regras/AvaliacaoDaLeitura';

const faixa = { minimo: 10, maximo: 20 };

test.each([
  ['abaixo do mínimo', 9.9, 'abaixo'],
  ['exatamente no mínimo', 10, 'ideal'],
  ['dentro da faixa', 15, 'ideal'],
  ['exatamente no máximo', 20, 'ideal'],
  ['acima do máximo', 20.1, 'acima'],
] as const)('%s: %p retorna %s', (_, valor, esperado) => {
  expect(compararMedicaoComFaixa(valor, faixa)).toBe(esperado);
});

test('compara as três grandezas usando a mesma regra', () => {
  const leitura: Leitura = {
    umidadePercentual: 39,
    temperaturaCelsius: 24,
    luminosidadeLux: 21000,
    medidaEm: new Date(2026, 9, 17, 14, 0),
  };
  const faixas: FaixasRecomendadas = {
    umidadeDoAr: { minimo: 40, maximo: 70 },
    temperatura: { minimo: 18, maximo: 28 },
    luminosidade: { minimo: 5000, maximo: 20000 },
  };

  const situacoes = compararLeituraComFaixas(leitura, faixas);
  expect(situacoes).toEqual({ umidadeDoAr: 'abaixo', temperatura: 'ideal', luminosidade: 'acima' });
  expect(todasAsMedicoesEstaoIdeais(situacoes)).toBe(false);
});

test('reconhece quando todas as grandezas estão ideais', () => {
  expect(todasAsMedicoesEstaoIdeais({ umidadeDoAr: 'ideal', temperatura: 'ideal', luminosidade: 'ideal' })).toBe(
    true,
  );
});

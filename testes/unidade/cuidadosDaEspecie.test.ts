import { textoDaLuz, textoDaRega, textoDaTemperatura } from '@/apresentacao/componentes/cuidadosDaEspecie';

describe('a frequência de rega', () => {
  test.each([
    [1, 'Regar todo dia'],
    [2, 'Regar a cada 2 dias'],
    [3, 'Regar a cada 3 dias'],
    [7, 'Regar uma vez por semana'],
    [10, 'Regar a cada 10 dias'],
    [14, 'Regar a cada 2 semanas'],
  ])('intervalo de %i dia(s): "%s"', (dias, texto) => {
    expect(textoDaRega(dias)).toBe(texto);
  });
});

describe('a exposição ao sol, pelos quatro níveis de luz do catálogo (luz do dia, em mol/m²)', () => {
  test.each([
    [3, 'Pouca luz: aguenta cantos com luz fraca'],
    [6, 'Luz indireta: perto de uma janela, sem sol direto'],
    [12, 'Sol parcial: 3 a 6 horas de sol direto por dia'],
    [18, 'Sol pleno: 6 horas ou mais de sol direto por dia'],
  ])('mínimo de %i: "%s"', (minimo, texto) => {
    expect(textoDaLuz({ minimo, maximo: minimo * 2 })).toBe(texto);
  });

  test('valores entre os níveis caem no nível de baixo', () => {
    expect(textoDaLuz({ minimo: 10, maximo: 14 })).toMatch(/^Luz indireta/);
    expect(textoDaLuz({ minimo: 17, maximo: 25 })).toMatch(/^Sol parcial/);
  });
});

test('a temperatura usa a faixa do dia, com vírgula decimal', () => {
  expect(textoDaTemperatura({ minimo: 21, maximo: 30 })).toBe('Prefere entre 21 e 30 °C');
  expect(textoDaTemperatura({ minimo: 15.5, maximo: 28 })).toBe('Prefere entre 15,5 e 28 °C');
});

import { escreverDia, lerDia, lerQuantidade } from '@/apresentacao/colheita/entradaDaColheita';

describe('lerQuantidade', () => {
  test.each([
    ['12', 12],
    [' 7 ', 7],
    ['250,5', 250.5],
    ['250.5', 250.5],
    ['0', 0],
  ])('"%s" vira %p', (texto, numero) => {
    expect(lerQuantidade(texto)).toBe(numero);
  });

  test('campo vazio vira null, para a mensagem pedir a quantidade', () => {
    expect(lerQuantidade('')).toBeNull();
    expect(lerQuantidade('   ')).toBeNull();
  });

  test.each(['-3', 'doze', '1,2,3', '1e3', '12 frutos'])('"%s" não é quantidade e vira NaN', (texto) => {
    expect(lerQuantidade(texto)).toBeNaN();
  });
});

describe('lerDia', () => {
  test('aceita dia e mês com um ou dois dígitos', () => {
    expect(lerDia('05/11/2026')).toEqual({ dia: 5, mes: 11, ano: 2026 });
    expect(lerDia(' 5/1/2026 ')).toEqual({ dia: 5, mes: 1, ano: 2026 });
  });

  test.each(['', '05-11-2026', '05/11/26', '2026/11/05', 'hoje'])('"%s" é ilegível', (texto) => {
    expect(lerDia(texto)).toBe('ilegivel');
  });
});

test('escreverDia completa dia e mês com zero, e lerDia lê de volta', () => {
  expect(escreverDia({ dia: 5, mes: 1, ano: 2026 })).toBe('05/01/2026');
  expect(lerDia(escreverDia({ dia: 5, mes: 1, ano: 2026 }))).toEqual({ dia: 5, mes: 1, ano: 2026 });
});

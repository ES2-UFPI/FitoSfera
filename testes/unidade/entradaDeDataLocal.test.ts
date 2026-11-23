import { formatarDataLocal, lerDataLocalNaoFutura } from '@/apresentacao/colheita/entradaDeDataLocal';

const hoje = new Date(2026, 9, 17, 14);

test('lê uma data local DD/MM/AAAA', () => {
  expect(lerDataLocalNaoFutura('12/10/2026', hoje)).toEqual(new Date(2026, 9, 12));
});

test.each(['', 'ontem', '31/02/2026', '18/10/2026'])('recusa data inválida ou futura: %s', (texto) => {
  expect(lerDataLocalNaoFutura(texto, hoje)).toBe('invalida');
});

test('formata a data para edição', () => {
  expect(formatarDataLocal(new Date(2026, 0, 5))).toBe('05/01/2026');
});

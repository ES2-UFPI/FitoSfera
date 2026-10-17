import { dataPorExtenso, descreverQuantidade, saudacaoPara } from '@/apresentacao/componentes/textosDoCabecalho';

test.each([
  [4, 59, 'Boa noite'],
  [5, 0, 'Bom dia'],
  [11, 59, 'Bom dia'],
  [12, 0, 'Boa tarde'],
  [17, 59, 'Boa tarde'],
  [18, 0, 'Boa noite'],
])('%i:%i → %s', (hora, minuto, saudacao) => {
  expect(saudacaoPara(new Date(2026, 9, 15, hora, minuto))).toBe(saudacao);
});

test('data por extenso em caixa-alta', () => {
  expect(dataPorExtenso(new Date(2026, 9, 15))).toBe('QUINTA · 15 DE OUTUBRO');
});

test('sábado e março com acento', () => {
  expect(dataPorExtenso(new Date(2026, 2, 7))).toBe('SÁBADO · 7 DE MARÇO');
});

test.each([
  [0, 'Ainda sem plantas por aqui'],
  [1, '1 planta na sua estante'],
  [6, '6 plantas na sua estante'],
])('descreverQuantidade(%i)', (quantidade, texto) => {
  expect(descreverQuantidade(quantidade)).toBe(texto);
});

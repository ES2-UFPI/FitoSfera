import { decodificarPacote } from '@/infraestrutura/sensores/DecodificadorDoPacote';

describe('pacotes de exemplo do README do firmware', () => {
  test('normal: D2 09 A8 16 E8 03 00 00', () => {
    expect(decodificarPacote('0gmoFugDAAA=')).toEqual({
      temperaturaCelsius: 25.14,
      umidadePercentual: 58,
      luminosidadeLux: 1000,
    });
  });

  test('temperatura negativa e sol forte: A2 FE 40 1F C0 D4 01 00', () => {
    expect(decodificarPacote('ov5AH8DUAQA=')).toEqual({
      temperaturaCelsius: -3.5,
      umidadePercentual: 80,
      luminosidadeLux: 120000,
    });
  });

  test('BH1750 sem leitura: a luz vem null e o resto continua valendo', () => {
    expect(decodificarPacote('0gmoFv////8=')).toEqual({
      temperaturaCelsius: 25.14,
      umidadePercentual: 58,
      luminosidadeLux: null,
    });
  });
});

test.each([
  ['vazio (ainda não há leitura)', ''],
  ['null', null],
  ['tamanho errado', 'AQID'],
  ['base64 inválido', '***'],
])('%s vira null', (_caso, valor) => {
  expect(decodificarPacote(valor)).toBeNull();
});

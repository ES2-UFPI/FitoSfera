import { decodificarPacote } from '@/infraestrutura/sensores/DecodificadorDoPacote';

describe('pacotes de exemplo do README do firmware', () => {
  test('normal: D2 09 A8 16 E8 03 00 00', () => {
    expect(decodificarPacote('0gmoFugDAAA=')).toEqual({
      tipo: 'legado',
      temperaturaCelsius: 25.14,
      umidadePercentual: 58,
      luminosidadeLux: 1000,
    });
  });

  test('temperatura negativa e sol forte: A2 FE 40 1F C0 D4 01 00', () => {
    expect(decodificarPacote('ov5AH8DUAQA=')).toEqual({
      tipo: 'legado',
      temperaturaCelsius: -3.5,
      umidadePercentual: 80,
      luminosidadeLux: 120000,
    });
  });

  test('BH1750 sem leitura: a luz vem null e o resto continua valendo', () => {
    expect(decodificarPacote('0gmoFv////8=')).toEqual({
      tipo: 'legado',
      temperaturaCelsius: 25.14,
      umidadePercentual: 58,
      luminosidadeLux: null,
    });
  });
});

describe('pacote novo de 19 bytes', () => {
  test('decodifica sequência, reinício, acumulado, tempo sem confirmação e medições', () => {
    expect(decodificarPacote('KjQSBhIPAEEBAADSCagW6AMAAA==')).toEqual({
      tipo: 'novo',
      sequencia: 42,
      idReinicio: 0x1234,
      luzAcumuladaLuxMinutos: 987654,
      segundosDesdeUltimaConfirmacao: 321,
      temperaturaCelsius: 25.14,
      umidadePercentual: 58,
      luminosidadeLux: 1000,
    });
  });

  test('converte os sentinelas de temperatura, umidade e luminosidade em ausência', () => {
    expect(decodificarPacote('KjQSBhIPAEEBAAAAgP///////w==')).toEqual({
      tipo: 'novo',
      sequencia: 42,
      idReinicio: 0x1234,
      luzAcumuladaLuxMinutos: 987654,
      segundosDesdeUltimaConfirmacao: 321,
      temperaturaCelsius: null,
      umidadePercentual: null,
      luminosidadeLux: null,
    });
  });
});

test.each([
  ['vazio (ainda não há leitura)', ''],
  ['null', null],
  ['tamanho errado', 'AQID'],
  ['tamanho intermediário', 'AQIDBAUGBwgJ'],
  ['base64 inválido', '***'],
])('%s vira null', (_caso, valor) => {
  expect(decodificarPacote(valor)).toBeNull();
});

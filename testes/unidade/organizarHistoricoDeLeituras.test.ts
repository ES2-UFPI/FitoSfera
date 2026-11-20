import { Leitura } from '@/dominio/modelos/Leitura';
import { organizarHistoricoDeLeituras } from '@/infraestrutura/persistencia/organizarHistoricoDeLeituras';

const referencia = new Date('2026-11-07T12:30:00.000Z');

function leituraHa(minutos: number): Leitura {
  return {
    umidadePercentual: 57,
    temperaturaCelsius: 24.5,
    luminosidadeLux: null,
    medidaEm: new Date(referencia.getTime() - minutos * 60_000),
  };
}

test('inclui a leitura recebida em um histórico vazio', () => {
  const leitura = leituraHa(0);
  expect(organizarHistoricoDeLeituras([], leitura, referencia)).toEqual([leitura]);
});

test('ordena cronologicamente sem modificar o histórico recebido', () => {
  const recente = Object.freeze(leituraHa(0));
  const antiga = Object.freeze(leituraHa(60));
  const intermediaria = Object.freeze(leituraHa(30));
  const historico = Object.freeze([recente, antiga]);

  expect(organizarHistoricoDeLeituras(historico, intermediaria, referencia))
    .toEqual([antiga, intermediaria, recente]);
  expect(historico).toEqual([recente, antiga]);
});

test('substitui leituras do mesmo instante pela leitura recebida', () => {
  const anterior = leituraHa(0);
  const recebida = { ...anterior, temperaturaCelsius: 26 };

  expect(organizarHistoricoDeLeituras([anterior, anterior], recebida, referencia)).toEqual([recebida]);
});

test('mantém a última ocorrência de duplicatas que já estavam no histórico', () => {
  const anterior = leituraHa(30);
  const corrigida = { ...anterior, umidadePercentual: 60 };
  const recebida = leituraHa(0);

  expect(organizarHistoricoDeLeituras([anterior, corrigida], recebida, referencia))
    .toEqual([corrigida, recebida]);
});

test('inclui o limite de 24 horas e descarta leituras anteriores a ele', () => {
  const foraDaJanela = leituraHa(24 * 60 + 1);
  const noLimite = leituraHa(24 * 60);
  const recebida = leituraHa(0);

  expect(organizarHistoricoDeLeituras([foraDaJanela, noLimite], recebida, referencia))
    .toEqual([noLimite, recebida]);
});

test('usa a medição mais recente como referência mesmo quando a recebida é antiga', () => {
  const recente = leituraHa(0);
  const recebida = leituraHa(24 * 60 + 1);

  expect(organizarHistoricoDeLeituras([recente], recebida, referencia)).toEqual([recente]);
});

test('limita o histórico às 2.000 leituras mais recentes', () => {
  const historico = Array.from({ length: 2001 }, (_, indice) => ({
    ...leituraHa(0),
    medidaEm: new Date(referencia.getTime() - (indice + 1) * 1000),
  }));
  const recebida = leituraHa(0);
  const resultado = organizarHistoricoDeLeituras(historico, recebida, referencia);

  expect(resultado).toHaveLength(2000);
  expect(resultado[0]).toEqual(historico[1998]);
  expect(resultado[1999]).toEqual(recebida);
});

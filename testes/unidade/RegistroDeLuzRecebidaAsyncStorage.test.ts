import { Leitura } from '@/dominio/modelos/Leitura';
import { CHAVES } from '@/infraestrutura/persistencia/chaves';
import {
  LIMITE_DE_PERIODOS_DE_LUZ,
  RegistroDeLuzRecebidaAsyncStorage,
} from '@/infraestrutura/persistencia/RegistroDeLuzRecebidaAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';

const HORA_MS = 3_600_000;
const INICIO = new Date('2026-11-08T08:00:00.000Z').getTime();

function leitura(luz: number, horas: number, idReinicio = 7): Leitura {
  const medidaEm = new Date(INICIO + horas * HORA_MS);
  return {
    temperaturaCelsius: 25,
    umidadePercentual: 60,
    luminosidadeLux: 1000,
    medidaEm,
    contadorDeLuz: { idReinicio, luzAcumuladaLuxMinutos: luz, segundosSemConfirmacao: 0, ultimaComunicacaoEm: medidaEm },
  };
}

function montar() {
  const armazenamento = new ArmazenamentoEmMemoria();
  return { armazenamento, registro: new RegistroDeLuzRecebidaAsyncStorage(armazenamento) };
}

test('ao reconectar, a luz acumulada sem conexão fica registrada com o período', async () => {
  const { registro } = montar();
  await registro.registrar('sala', leitura(1_000, 0));
  await registro.registrar('sala', leitura(4_000, 10));

  expect(await registro.listar('sala')).toEqual([{
    luxMinutos: 3_000,
    inicio: leitura(0, 0).medidaEm,
    fim: leitura(0, 10).medidaEm,
    incompleta: false,
  }]);
});

test('o app fechado no meio não perde a marca: outra instância continua de onde parou', async () => {
  const { armazenamento, registro } = montar();
  await registro.registrar('sala', leitura(1_000, 0));

  const reaberto = new RegistroDeLuzRecebidaAsyncStorage(armazenamento);
  await reaberto.registrar('sala', leitura(1_600, 1));

  expect((await reaberto.listar('sala')).map((periodo) => periodo.luxMinutos)).toEqual([600]);
});

test('receber o mesmo pacote duas vezes, mesmo ao mesmo tempo, não conta a luz duas vezes', async () => {
  const { registro } = montar();
  await registro.registrar('sala', leitura(1_000, 0));
  await Promise.all([registro.registrar('sala', leitura(1_600, 1)), registro.registrar('sala', leitura(1_600, 1))]);

  expect((await registro.listar('sala')).map((periodo) => periodo.luxMinutos)).toEqual([600]);
});

test('depois de um reinício do sensor, fica um período incompleto sem luz, e a contagem segue do novo contador', async () => {
  const { registro } = montar();
  await registro.registrar('sala', leitura(1_000, 0));
  await registro.registrar('sala', leitura(50, 2, 8));
  await registro.registrar('sala', leitura(80, 3, 8));

  expect((await registro.listar('sala')).map(({ luxMinutos, incompleta }) => ({ luxMinutos, incompleta }))).toEqual([
    { luxMinutos: 0, incompleta: true },
    { luxMinutos: 30, incompleta: false },
  ]);
});

test('leitura sem contador, como a do pacote de 8 bytes, não gera luz nem mexe na marca', async () => {
  const { armazenamento, registro } = montar();
  const { contadorDeLuz: _semContador, ...legada } = leitura(0, 1);
  await registro.registrar('sala', legada);
  expect(armazenamento.valores.size).toBe(0);

  await registro.registrar('sala', leitura(1_000, 0));
  await registro.registrar('sala', legada);
  await registro.registrar('sala', leitura(1_200, 2));
  expect((await registro.listar('sala')).map((periodo) => periodo.luxMinutos)).toEqual([200]);
});

test('cada jardim tem a sua contagem', async () => {
  const { registro } = montar();
  await registro.registrar('sala', leitura(1_000, 0));
  await registro.registrar('varanda', leitura(5_000, 0));
  await registro.registrar('sala', leitura(1_100, 1));

  expect(await registro.listar('varanda')).toEqual([]);
  expect(await registro.listar('sala')).toHaveLength(1);
});

test('guarda só os períodos mais recentes, para o registro não crescer sem limite', async () => {
  const { registro } = montar();
  await registro.registrar('sala', leitura(0, 0));
  for (let passo = 1; passo <= LIMITE_DE_PERIODOS_DE_LUZ + 2; passo++) await registro.registrar('sala', leitura(passo, passo));

  const periodos = await registro.listar('sala');
  expect(periodos).toHaveLength(LIMITE_DE_PERIODOS_DE_LUZ);
  expect(periodos[periodos.length - 1]?.fim).toEqual(leitura(0, LIMITE_DE_PERIODOS_DE_LUZ + 2).medidaEm);
});

test('conteúdo ilegível recomeça a contagem sem inventar luz', async () => {
  const armazenamento = new ArmazenamentoEmMemoria({ [CHAVES.luzDoJardim('sala')]: 'não é json' });
  const registro = new RegistroDeLuzRecebidaAsyncStorage(armazenamento);

  expect(await registro.listar('sala')).toEqual([]);
  await registro.registrar('sala', leitura(987_654, 0));
  expect(await registro.listar('sala')).toEqual([]);
});

test('uma falha ao gravar não trava as próximas contagens', async () => {
  const { armazenamento, registro } = montar();
  await registro.registrar('sala', leitura(1_000, 0));
  const gravar = jest.spyOn(armazenamento, 'setItem').mockRejectedValueOnce(new Error('disco cheio'));

  await expect(registro.registrar('sala', leitura(1_100, 1))).rejects.toThrow('disco cheio');
  gravar.mockRestore();
  await registro.registrar('sala', leitura(1_300, 2));

  expect((await registro.listar('sala')).map((periodo) => periodo.luxMinutos)).toEqual([300]);
});

test('depois de fechar e reabrir o app, os períodos e o último contato com o sensor continuam lá', async () => {
  const { armazenamento, registro } = montar();
  await registro.registrar('sala', leitura(1_000, 0));
  await registro.registrar('sala', leitura(1_600, 1));

  const reaberto = new RegistroDeLuzRecebidaAsyncStorage(armazenamento);
  expect(await reaberto.listar('sala')).toEqual(await registro.listar('sala'));
  expect(await reaberto.obterUltimoContato('sala')).toEqual(leitura(0, 1).medidaEm);
});

test('sem nenhum contador recebido, não há último contato', async () => {
  const { registro } = montar();
  expect(await registro.obterUltimoContato('sala')).toBeNull();
});

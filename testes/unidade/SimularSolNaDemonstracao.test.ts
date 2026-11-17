import { SimularSolNaDemonstracao } from '@/aplicacao/casos-de-uso/SimularSolNaDemonstracao';
import { LUX_DO_SOL_FORTE } from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { CHAVES } from '@/infraestrutura/persistencia/chaves';
import { RegistroDeLuzRecebidaAsyncStorage } from '@/infraestrutura/persistencia/RegistroDeLuzRecebidaAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';
import { RelogioParado } from '../apoio/fakes';

const MARCA = { idReinicio: 42, luzAcumuladaLuxMinutos: 9_000, medidaEm: new Date(2026, 10, 17, 8, 0) };

async function montar(agora = new Date(2026, 10, 17, 8, 1)) {
  const armazenamento = new ArmazenamentoEmMemoria();
  await armazenamento.setItem(CHAVES.luzDoJardim('sala'), JSON.stringify({ marca: MARCA, periodos: [] }));
  const registro = new RegistroDeLuzRecebidaAsyncStorage(armazenamento);
  return { armazenamento, registro, simular: new SimularSolNaDemonstracao(registro, new RelogioParado(agora)) };
}

test('preenche a luz desde as 7h e deixa a marca do sensor como estava', async () => {
  const { armazenamento, registro, simular } = await montar();

  expect(await simular.executar('sala')).toBe('preenchido');

  const periodos = await registro.listar('sala');
  expect(periodos.reduce((soma, p) => soma + p.luxMinutos, 0)).toBe(LUX_DO_SOL_FORTE * 60);
  const salvo = JSON.parse((await armazenamento.getItem(CHAVES.luzDoJardim('sala')))!);
  expect(salvo.marca).toEqual({ ...MARCA, medidaEm: MARCA.medidaEm.toISOString() });
});

test('a próxima leitura do sensor continua a conta a partir da marca', async () => {
  const { registro, simular } = await montar();
  await simular.executar('sala');

  const medidaEm = new Date(2026, 10, 17, 8, 5);
  await registro.registrar('sala', {
    temperaturaCelsius: 25, umidadePercentual: 60, luminosidadeLux: 500, medidaEm,
    contadorDeLuz: { idReinicio: 42, luzAcumuladaLuxMinutos: 11_500, segundosSemConfirmacao: 0, ultimaComunicacaoEm: medidaEm },
  });

  expect((await registro.listar('sala')).at(-1)).toEqual({
    luxMinutos: 2_500, inicio: MARCA.medidaEm, fim: medidaEm, incompleta: false,
  });
});

test('quando não há o que preencher, não grava nada e diz o motivo', async () => {
  const { armazenamento, simular } = await montar(new Date(2026, 10, 18, 9, 0));
  const antes = await armazenamento.getItem(CHAVES.luzDoJardim('sala'));

  expect(await simular.executar('sala')).toBe('sem-leitura-hoje');
  expect(await armazenamento.getItem(CHAVES.luzDoJardim('sala'))).toBe(antes);
});

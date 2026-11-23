import { LUX_DO_SOL_FORTE } from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { calcularLuzDoDia, luxMinutosParaDli } from '@/dominio/regras/LuzDoDia';
import { RegistroDeLuzRecebidaAsyncStorage } from '@/infraestrutura/persistencia/RegistroDeLuzRecebidaAsyncStorage';
import { SensoresSimuladosDosJardins } from '@/infraestrutura/sensores/SensoresSimuladosDosJardins';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';
import { RelogioParado } from '../apoio/fakes';

const hora = (horas: number, minutos = 0) => new Date(2026, 10, 16, horas, minutos);

function montar(agora: Date) {
  const relogio = new RelogioParado(agora);
  const luz = new RegistroDeLuzRecebidaAsyncStorage(new ArmazenamentoEmMemoria());
  const simulados = new SensoresSimuladosDosJardins(relogio, luz);
  return { relogio, luz, simulados };
}

describe('simular sol desde as 7h', () => {
  test('preenche períodos de 5 minutos com sol forte, das 7h até agora', async () => {
    const { luz, simulados } = montar(hora(9, 2));

    expect(await simulados.simularSolDesdeAs7h('jardim-principal')).toBe(true);

    const periodos = await luz.listar('jardim-principal');
    expect(periodos).toHaveLength(25);
    expect(periodos[0]).toEqual({ luxMinutos: LUX_DO_SOL_FORTE * 5, inicio: hora(7), fim: hora(7, 5), incompleta: false });
    expect(periodos[24]).toEqual({ luxMinutos: LUX_DO_SOL_FORTE * 2, inicio: hora(9), fim: hora(9, 2), incompleta: false });
    expect(await luz.obterUltimoContato('jardim-principal')).toEqual(hora(9, 2));
  });

  test('a luz do dia fica completa e equivale a sol forte desde as 7h', async () => {
    const { luz, simulados } = montar(hora(11));
    await simulados.simularSolDesdeAs7h('jardim-principal');

    const dia = calcularLuzDoDia({
      periodos: await luz.listar('jardim-principal'),
      conhecidaAte: await luz.obterUltimoContato('jardim-principal'),
      meta: { minimo: 12, maximo: 16 },
      agora: hora(11),
    });
    expect(dia.incompleta).toBe(false);
    expect(dia.dli).toBeCloseTo(luxMinutosParaDli(LUX_DO_SOL_FORTE * 4 * 60));
  });

  test('depois de preencher, as leituras do simulador continuam a conta de onde o sol parou', async () => {
    const { relogio, luz, simulados } = montar(hora(11));
    const sensor = simulados.obterSensor('jardim-principal');
    sensor.definirConfiguracao({ umidade: 'automatico', temperatura: 'automatico', luminosidade: 'baixo', desconectado: false });
    await simulados.simularSolDesdeAs7h('jardim-principal');

    relogio.avancar(5 * 60_000);
    const leitura = await sensor.lerLeituraAtual();
    if (leitura === null) throw new Error('o simulador ligado sempre tem leitura');
    await luz.registrar('jardim-principal', leitura);

    const periodos = await luz.listar('jardim-principal');
    expect(periodos).toHaveLength(49);
    expect(periodos[48]).toEqual({ luxMinutos: 500 * 5, inicio: hora(11), fim: hora(11, 5), incompleta: false });
  });

  test('preencher de novo troca a luz de hoje, sem somar duas vezes', async () => {
    const { relogio, luz, simulados } = montar(hora(9));
    await simulados.simularSolDesdeAs7h('jardim-principal');
    relogio.avancar(60 * 60_000);
    await simulados.simularSolDesdeAs7h('jardim-principal');

    expect(await luz.listar('jardim-principal')).toHaveLength(36);
  });

  test('cada jardim tem a sua luz', async () => {
    const { luz, simulados } = montar(hora(8));
    await simulados.simularSolDesdeAs7h('varanda');

    expect(await luz.listar('varanda')).toHaveLength(12);
    expect(await luz.listar('jardim-principal')).toEqual([]);
  });

  test('antes das 7h não há o que preencher', async () => {
    const { luz, simulados } = montar(hora(6, 30));

    expect(await simulados.simularSolDesdeAs7h('jardim-principal')).toBe(false);
    expect(await luz.listar('jardim-principal')).toEqual([]);
  });

  test('sem onde gravar a luz, não preenche nada', async () => {
    expect(await new SensoresSimuladosDosJardins(new RelogioParado(hora(10))).simularSolDesdeAs7h()).toBe(false);
  });
});

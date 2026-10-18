import { escolherSensor } from '@/composicao/escolherSensor';
import { SensorIndisponivel } from '@/infraestrutura/sensores/SensorIndisponivel';
import { SensorSimulado } from '@/infraestrutura/sensores/SensorSimulado';
import { RelogioParado } from '../apoio/fakes';

describe('SensorIndisponivel', () => {
  const sensor = new SensorIndisponivel();

  test('não tem leitura e se declara indisponível', async () => {
    expect(await sensor.lerLeituraAtual()).toBeNull();
    expect(await sensor.consultarEstadoDaConexao()).toBe('indisponivel');
  });

  test('observar nunca avisa e pode ser cancelado', () => {
    const aoReceber = jest.fn();
    const cancelar = sensor.observarLeituras(aoReceber);
    expect(() => cancelar()).not.toThrow();
    expect(aoReceber).not.toHaveBeenCalled();
  });
});

describe('SensorSimulado', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const instante = new Date('2026-10-18T13:00:00.000Z');

  test('está conectado e a leitura atual é medida agora, com valores de um ambiente de casa', async () => {
    const sensor = new SensorSimulado(new RelogioParado(instante));
    const leitura = await sensor.lerLeituraAtual();
    expect(await sensor.consultarEstadoDaConexao()).toBe('conectado');
    expect(leitura?.medidaEm).toEqual(instante);
    expect(leitura?.umidadePercentual).toBeGreaterThanOrEqual(0);
    expect(leitura?.umidadePercentual).toBeLessThanOrEqual(100);
    expect(leitura?.temperaturaCelsius).toBeGreaterThan(10);
    expect(leitura?.temperaturaCelsius).toBeLessThan(40);
    expect(leitura?.luminosidadeLux).toBeGreaterThanOrEqual(0);
  });

  test('observar avisa uma leitura a cada intervalo até ser cancelado', () => {
    const sensor = new SensorSimulado(new RelogioParado(instante), 1000);
    const aoReceber = jest.fn();
    const cancelar = sensor.observarLeituras(aoReceber);

    jest.advanceTimersByTime(3000);
    expect(aoReceber).toHaveBeenCalledTimes(3);
    expect(aoReceber.mock.calls[0][0].medidaEm).toEqual(instante);

    cancelar();
    jest.advanceTimersByTime(3000);
    expect(aoReceber).toHaveBeenCalledTimes(3);
  });

  test('as leituras variam com o tempo, sem sair das faixas de um ambiente de casa', async () => {
    const horas = [0, 3, 6, 9, 12, 15, 18, 21];
    const leituras = await Promise.all(
      horas.map((hora) =>
        new SensorSimulado(new RelogioParado(new Date(instante.getTime() + hora * 3_600_000))).lerLeituraAtual(),
      ),
    );
    const luzes = new Set(leituras.map((leitura) => leitura?.luminosidadeLux));
    expect(luzes.size).toBeGreaterThan(1);
    leituras.forEach((leitura) => {
      expect(leitura?.umidadePercentual).toBeGreaterThanOrEqual(0);
      expect(leitura?.umidadePercentual).toBeLessThanOrEqual(100);
      expect(leitura?.luminosidadeLux).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('escolherSensor (variável EXPO_PUBLIC_SENSOR)', () => {
  const relogio = new RelogioParado();

  test.each(['simulado', ' Simulado ', 'SIMULADO'])('"%s" escolhe o sensor simulado', (valor) => {
    expect(escolherSensor(valor, relogio)).toBeInstanceOf(SensorSimulado);
  });

  test.each([undefined, '', 'indisponivel', 'bluetooth-que-ainda-nao-existe'])(
    '%p escolhe o sensor indisponível, que é o padrão',
    (valor) => {
      expect(escolherSensor(valor, relogio)).toBeInstanceOf(SensorIndisponivel);
    },
  );
});

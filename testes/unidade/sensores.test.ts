import { escolherSensor } from '@/composicao/escolherSensor';
import { SensorIndisponivel } from '@/infraestrutura/sensores/SensorIndisponivel';
import { SensorSimulado } from '@/infraestrutura/sensores/SensorSimulado';
import { RelogioParado } from '../apoio/fakes';

const CONFIGURACAO_AUTOMATICA = {
  umidade: 'automatico',
  temperatura: 'automatico',
  luminosidade: 'automatico',
  desconectado: false,
} as const;

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

describe('contador de luz do SensorSimulado', () => {
  const as10h = new Date(2026, 10, 16, 10, 0);
  const minutosDepois = (minutos: number) => new Date(as10h.getTime() + minutos * 60_000);
  const contador = async (sensor: SensorSimulado) => (await sensor.lerLeituraAtual())?.contadorDeLuz?.luzAcumuladaLuxMinutos ?? NaN;
  const comLuzBaixa = (relogio: RelogioParado) => {
    const sensor = new SensorSimulado(relogio);
    sensor.definirConfiguracao({ ...CONFIGURACAO_AUTOMATICA, luminosidade: 'baixo' });
    return sensor;
  };

  test('a leitura leva o contador, como a do sensor físico, com o id de um aparelho sempre ligado', async () => {
    const leitura = await new SensorSimulado(new RelogioParado(as10h)).lerLeituraAtual();
    expect(leitura?.contadorDeLuz).toEqual({
      idReinicio: 1,
      luzAcumuladaLuxMinutos: expect.any(Number),
      segundosSemConfirmacao: 0,
      ultimaComunicacaoEm: as10h,
    });
  });

  test('reabrir o app dá o mesmo contador: o aparelho simulado não reinicia', async () => {
    const primeiro = await new SensorSimulado(new RelogioParado(as10h)).lerLeituraAtual();
    const reaberto = await new SensorSimulado(new RelogioParado(as10h)).lerLeituraAtual();
    expect(reaberto?.contadorDeLuz).toEqual(primeiro?.contadorDeLuz);
  });

  test('no automático, soma a luz da curva do dia, mesmo sem medição no meio', async () => {
    const relogio = new RelogioParado(new Date(2026, 10, 16, 6, 0));
    const sensor = new SensorSimulado(relogio);
    const noNascer = await contador(sensor);
    relogio.avancar(12 * 3_600_000);

    // A curva de um dia inteiro: 23.000 lux no pico, das 6h às 18h.
    expect((await contador(sensor)) - noNascer).toBeCloseTo(23000 * (24 / Math.PI) * 60, -1);
  });

  test('à noite, o contador não muda', async () => {
    const relogio = new RelogioParado(new Date(2026, 10, 16, 20, 0));
    const sensor = new SensorSimulado(relogio);
    const antes = await contador(sensor);
    relogio.avancar(3 * 3_600_000);
    expect(await contador(sensor)).toBe(antes);
  });

  test('com a luz forçada, soma o nível forçado entre uma medição e outra', async () => {
    const relogio = new RelogioParado(as10h);
    const sensor = comLuzBaixa(relogio);
    const antes = await contador(sensor);
    relogio.avancar(5 * 60_000);
    await contador(sensor);
    relogio.avancar(5 * 60_000);

    expect((await contador(sensor)) - antes).toBe(500 * 10);
  });

  test('continua somando desconectado, como o sensor físico com o celular longe', async () => {
    const relogio = new RelogioParado(as10h);
    const sensor = comLuzBaixa(relogio);
    const antes = await contador(sensor);
    sensor.definirConfiguracao({ ...CONFIGURACAO_AUTOMATICA, luminosidade: 'baixo', desconectado: true });
    relogio.avancar(5 * 60_000);
    expect(await sensor.lerLeituraAtual()).toBeNull();
    relogio.avancar(5 * 60_000);
    sensor.definirConfiguracao({ ...CONFIGURACAO_AUTOMATICA, luminosidade: 'baixo' });

    expect((await contador(sensor)) - antes).toBe(500 * 10);
  });

  test('a marca do contador é o valor de agora, no relógio da simulação', async () => {
    const relogio = new RelogioParado(as10h);
    const sensor = comLuzBaixa(relogio);
    const antes = await contador(sensor);
    relogio.avancar(4 * 60_000);

    expect(sensor.marcaDoContador()).toEqual({ idReinicio: 1, luzAcumuladaLuxMinutos: antes + 2000, medidaEm: minutosDepois(4) });
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

  describe('o dia simulado segue o horário local', () => {
    const lerAs = (horas: number, minutos = 0) =>
      new SensorSimulado(new RelogioParado(new Date(2026, 10, 15, horas, minutos))).lerLeituraAtual();

    test('a luz é maior ao meio-dia do que de manhã e no fim da tarde', async () => {
      const [manha, meioDia, tarde] = await Promise.all([lerAs(9), lerAs(12), lerAs(16)]);
      expect(meioDia!.luminosidadeLux).toBeGreaterThan(manha!.luminosidadeLux!);
      expect(meioDia!.luminosidadeLux).toBeGreaterThan(tarde!.luminosidadeLux!);
    });

    test('de noite não há luz', async () => {
      const leituras = await Promise.all([lerAs(19), lerAs(23), lerAs(0), lerAs(3), lerAs(5, 30)]);
      leituras.forEach((leitura) => expect(leitura?.luminosidadeLux).toBe(0));
    });

    test('a tarde é mais quente e mais seca que a madrugada', async () => {
      const [madrugada, tarde] = await Promise.all([lerAs(4), lerAs(14)]);
      expect(tarde!.temperaturaCelsius).toBeGreaterThan(madrugada!.temperaturaCelsius!);
      expect(tarde!.umidadePercentual).toBeLessThan(madrugada!.umidadePercentual!);
    });
  });

  test('permite forçar uma grandeza e avisa os observadores imediatamente', async () => {
    const sensor = new SensorSimulado(new RelogioParado(instante));
    const aoReceber = jest.fn();
    const cancelar = sensor.observarLeituras(aoReceber);

    sensor.definirConfiguracao({ ...CONFIGURACAO_AUTOMATICA, umidade: 'baixo' });

    expect(sensor.obterConfiguracao()).toEqual({ ...CONFIGURACAO_AUTOMATICA, umidade: 'baixo' });
    expect(await sensor.lerLeituraAtual()).toEqual(expect.objectContaining({ umidadePercentual: 10 }));
    expect(aoReceber).toHaveBeenCalledWith(expect.objectContaining({ umidadePercentual: 10 }));
    cancelar();
  });

  test('permite forçar luz acima de todas as faixas do catálogo', async () => {
    const sensor = new SensorSimulado(new RelogioParado(instante));
    sensor.definirConfiguracao({ ...CONFIGURACAO_AUTOMATICA, luminosidade: 'alto' });
    expect(await sensor.lerLeituraAtual()).toEqual(
      expect.objectContaining({ luminosidadeLux: 100000, medidaEm: instante }),
    );
  });

  test('combina calor, umidade baixa e luz alta na mesma leitura', async () => {
    const sensor = new SensorSimulado(new RelogioParado(instante));
    sensor.definirConfiguracao({
      umidade: 'baixo',
      temperatura: 'alto',
      luminosidade: 'alto',
      desconectado: false,
    });

    expect(await sensor.lerLeituraAtual()).toEqual(expect.objectContaining({
      umidadePercentual: 10,
      temperaturaCelsius: 40,
      luminosidadeLux: 100000,
      medidaEm: instante,
    }));
  });

  test('desconectado não tem leitura nem avisa no intervalo', async () => {
    const sensor = new SensorSimulado(new RelogioParado(instante), 1000);
    sensor.definirConfiguracao({ ...CONFIGURACAO_AUTOMATICA, desconectado: true });
    const aoReceber = jest.fn();
    const cancelar = sensor.observarLeituras(aoReceber);

    jest.advanceTimersByTime(3000);

    expect(await sensor.lerLeituraAtual()).toBeNull();
    expect(await sensor.consultarEstadoDaConexao()).toBe('desconectado');
    expect(aoReceber).not.toHaveBeenCalled();
    cancelar();
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

  test.each([undefined, ''])('%p usa o simulador como padrão somente em desenvolvimento', (valor) => {
    expect(escolherSensor(valor, relogio, true)).toBeInstanceOf(SensorSimulado);
    expect(escolherSensor(valor, relogio, false)).toBeInstanceOf(SensorIndisponivel);
  });

  test('uma escolha explícita pode desativar o simulador em desenvolvimento', () => {
    expect(escolherSensor('indisponivel', relogio, true)).toBeInstanceOf(SensorIndisponivel);
  });

  describe('bluetooth', () => {
    const bluetooth = new SensorIndisponivel();
    const criarBluetooth = () => bluetooth;

    test.each(['bluetooth', ' Bluetooth '])('"%s" escolhe o sensor Bluetooth', (valor) => {
      expect(escolherSensor(valor, relogio, true, criarBluetooth)).toBe(bluetooth);
    });

    test('sem valor, a produção usa o Bluetooth e o desenvolvimento continua no simulado', () => {
      expect(escolherSensor(undefined, relogio, false, criarBluetooth)).toBe(bluetooth);
      expect(escolherSensor(undefined, relogio, true, criarBluetooth)).toBeInstanceOf(SensorSimulado);
    });

    test('sem o módulo nativo (Expo Go, web), o Bluetooth vira indisponível', () => {
      expect(escolherSensor('bluetooth', relogio, true, () => null)).toBeInstanceOf(SensorIndisponivel);
      expect(escolherSensor(undefined, relogio, false, () => null)).toBeInstanceOf(SensorIndisponivel);
    });
  });
});

describe('observarConexao', () => {
  test('o indisponível avisa "indisponivel" na hora', () => {
    const aoMudar = jest.fn();
    new SensorIndisponivel().observarConexao(aoMudar);
    expect(aoMudar).toHaveBeenCalledWith({ estado: 'indisponivel', ultimaComunicacao: null });
  });

  test('o simulado avisa quando é desligado e religado, com a hora da última leitura', async () => {
    const instante = new Date('2026-10-22T13:00:00.000Z');
    const sensor = new SensorSimulado(new RelogioParado(instante));
    const aoMudar = jest.fn();
    sensor.observarConexao(aoMudar);
    await sensor.lerLeituraAtual();

    sensor.definirConfiguracao({ ...CONFIGURACAO_AUTOMATICA, desconectado: true });
    expect(aoMudar).toHaveBeenLastCalledWith({ estado: 'desconectado', ultimaComunicacao: instante });

    sensor.definirConfiguracao(CONFIGURACAO_AUTOMATICA);
    expect(aoMudar).toHaveBeenLastCalledWith({ estado: 'conectado', ultimaComunicacao: instante });
  });

  test('mudar só os níveis do simulado não avisa a conexão de novo', () => {
    const sensor = new SensorSimulado(new RelogioParado());
    const aoMudar = jest.fn();
    sensor.observarConexao(aoMudar);
    sensor.definirConfiguracao({ ...CONFIGURACAO_AUTOMATICA, umidade: 'alto' });
    expect(aoMudar).toHaveBeenCalledTimes(1);
  });
});

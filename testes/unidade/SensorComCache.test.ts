import { SensorComCache } from '@/infraestrutura/sensores/SensorComCache';
import { Leitura } from '@/dominio/modelos/Leitura';
import { CacheDeLeituras } from '@/dominio/portas/CacheDeLeituras';
import { SensorFixo } from '../apoio/fakes';

const leitura = { umidadePercentual: 55, temperaturaCelsius: 24, luminosidadeLux: 1200,
  medidaEm: new Date('2026-11-07T12:30:00.000Z') };

function montar(sensor: SensorFixo) {
  let cache: Leitura | null = null;
  const repositorio: CacheDeLeituras = {
    obter: async () => cache,
    salvar: async (_id, valor) => { cache = valor; },
  };
  return { sensor, leituras: repositorio, obterCache: () => cache };
}

test('persiste leituras atuais recebidas do sensor', async () => {
  const dependencias = montar(new SensorFixo(leitura));
  const sensor = new SensorComCache(dependencias.sensor, dependencias.leituras, 'sala');
  expect(await sensor.lerLeituraAtual()).toEqual(leitura);
  expect(dependencias.obterCache()).toEqual(leitura);
});

test('devolve o cache quando o sensor está offline, preservando a data para sinalizar desatualização', async () => {
  const dependencias = montar(new SensorFixo('falha'));
  await dependencias.leituras.salvar('sala', leitura);
  const sensor = new SensorComCache(dependencias.sensor, dependencias.leituras, 'sala');
  expect(await sensor.lerLeituraAtual()).toEqual(leitura);
});

test('atualização manual não disfarça falha do sensor com a leitura guardada', async () => {
  const dependencias = montar(new SensorFixo('falha'));
  await dependencias.leituras.salvar('sala', leitura);
  const sensor = new SensorComCache(dependencias.sensor, dependencias.leituras, 'sala');

  await expect(sensor.atualizarLeitura()).rejects.toThrow('sensor fora do ar');
  expect(dependencias.obterCache()).toEqual(leitura);
});

test('persiste novas leituras observadas', () => {
  const dependencias = montar(new SensorFixo());
  const sensor = new SensorComCache(dependencias.sensor, dependencias.leituras, 'sala');
  sensor.observarLeituras(() => undefined);
  dependencias.sensor.publicar(leitura);
  return Promise.resolve().then(() => expect(dependencias.obterCache()).toEqual(leitura));
});

describe('luz recebida', () => {
  const comContador: Leitura = {
    ...leitura,
    contadorDeLuz: {
      idReinicio: 7,
      luzAcumuladaLuxMinutos: 1_000,
      segundosSemConfirmacao: 300,
      ultimaComunicacaoEm: new Date('2026-11-07T12:25:00.000Z'),
    },
  };

  function montarComLuz(sensorFalso: SensorFixo) {
    const dependencias = montar(sensorFalso);
    const registrar = jest.fn(async () => undefined);
    const sensor = new SensorComCache(dependencias.sensor, dependencias.leituras, 'sala', { registrar });
    return { ...dependencias, registrar, sensor };
  }

  test('registra a luz da leitura atual, no jardim do sensor', async () => {
    const { registrar, sensor } = montarComLuz(new SensorFixo(comContador));
    await sensor.lerLeituraAtual();
    expect(registrar).toHaveBeenCalledWith('sala', comContador);
  });

  test('registra a luz da leitura aguardada', async () => {
    const { registrar, sensor } = montarComLuz(new SensorFixo(comContador));
    await sensor.aguardarLeitura();
    expect(registrar).toHaveBeenCalledWith('sala', comContador);
  });

  test('registra a luz das leituras observadas', async () => {
    const falso = new SensorFixo();
    const { registrar, sensor } = montarComLuz(falso);
    const aoReceber = jest.fn();
    sensor.observarLeituras(aoReceber);
    falso.publicar(comContador);
    await new Promise((resolver) => setImmediate(resolver));
    expect(registrar).toHaveBeenCalledWith('sala', comContador);
    expect(aoReceber).toHaveBeenCalledWith(comContador);
  });

  test('a leitura observada só chega a quem observa depois de a luz dela ser contabilizada', async () => {
    const falso = new SensorFixo();
    const { registrar, sensor } = montarComLuz(falso);
    let concluirRegistro: () => void = () => undefined;
    registrar.mockImplementation(() => new Promise<undefined>((resolver) => (concluirRegistro = () => resolver(undefined))));
    const aoReceber = jest.fn();
    sensor.observarLeituras(aoReceber);

    falso.publicar(comContador);
    await new Promise((resolver) => setImmediate(resolver));
    expect(aoReceber).not.toHaveBeenCalled();

    concluirRegistro();
    await new Promise((resolver) => setImmediate(resolver));
    expect(aoReceber).toHaveBeenCalledWith(comContador);
  });

  test('a última leitura salva não é registrada de novo quando o sensor está offline', async () => {
    const { leituras, registrar, sensor } = montarComLuz(new SensorFixo('falha'));
    await leituras.salvar('sala', comContador);
    await sensor.lerLeituraAtual();
    expect(registrar).not.toHaveBeenCalled();
  });

  test('uma falha ao registrar a luz não impede a entrega da leitura', async () => {
    const dependencias = montar(new SensorFixo(comContador));
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const sensor = new SensorComCache(dependencias.sensor, dependencias.leituras, 'sala', {
      registrar: async () => { throw new Error('disco cheio'); },
    });
    expect(await sensor.lerLeituraAtual()).toEqual(comContador);
    expect(aviso).toHaveBeenCalled();
    aviso.mockRestore();
  });
});

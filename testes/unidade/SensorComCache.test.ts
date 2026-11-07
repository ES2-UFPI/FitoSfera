import { SensorComCache } from '@/infraestrutura/sensores/SensorComCache';
import { Leitura } from '@/dominio/modelos/Leitura';
import { RepositorioDeLeituras } from '@/dominio/portas/RepositorioDeLeituras';
import { SensorFixo } from '../apoio/fakes';

const leitura = { umidadePercentual: 55, temperaturaCelsius: 24, luminosidadeLux: 1200,
  medidaEm: new Date('2026-11-07T12:30:00.000Z') };

function montar(sensor: SensorFixo) {
  let cache: Leitura | null = null;
  const repositorio: RepositorioDeLeituras = {
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

test('persiste novas leituras observadas', () => {
  const dependencias = montar(new SensorFixo());
  const sensor = new SensorComCache(dependencias.sensor, dependencias.leituras, 'sala');
  sensor.observarLeituras(() => undefined);
  dependencias.sensor.publicar(leitura);
  return Promise.resolve().then(() => expect(dependencias.obterCache()).toEqual(leitura));
});

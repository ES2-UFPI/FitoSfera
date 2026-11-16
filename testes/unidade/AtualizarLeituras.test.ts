import { AtualizarLeituras } from '@/aplicacao/casos-de-uso/AtualizarLeituras';
import { JARDIM_PRINCIPAL } from '@/dominio/modelos/Jardim';
import { Leitura } from '@/dominio/modelos/Leitura';
import { FontesDeJardim } from '@/dominio/portas/FontesDeJardim';
import { RepositorioDeJardinsEmMemoria, SensorFixo } from '../apoio/fakes';

/** Os jardins dos testes têm sensor: jardim sem sensor nem é consultado (último teste). */
const PRINCIPAL_COM_SENSOR = { ...JARDIM_PRINCIPAL, idSensor: 'sensor-da-sala' };

const leitura: Leitura = {
  temperaturaCelsius: 24,
  umidadePercentual: 55,
  luminosidadeLux: 12000,
  medidaEm: new Date('2026-11-08T12:00:00Z'),
};

test('atualiza cada jardim sem deixar a falha de uma fonte interromper as demais', async () => {
  const jardimDoQuintal = { ...JARDIM_PRINCIPAL, id: 'quintal', nome: 'Quintal', idSensor: 'sensor-do-quintal' };
  const jardins = new RepositorioDeJardinsEmMemoria([PRINCIPAL_COM_SENSOR, jardimDoQuintal]);
  const sensorPrincipal = new SensorFixo(leitura);
  const sensorDoQuintal = new SensorFixo('falha');
  const fontes: FontesDeJardim = {
    obter: jest.fn(async (id) => (id === JARDIM_PRINCIPAL.id ? sensorPrincipal : sensorDoQuintal)),
  };
  const aguardarPrincipal = jest.spyOn(sensorPrincipal, 'aguardarLeitura');
  const aguardarQuintal = jest.spyOn(sensorDoQuintal, 'aguardarLeitura');
  const atualizar = new AtualizarLeituras(jardins, fontes);

  await expect(atualizar.executar()).resolves.toEqual({ houveFalha: true });

  expect(fontes.obter).toHaveBeenCalledTimes(2);
  expect(fontes.obter).toHaveBeenNthCalledWith(1, JARDIM_PRINCIPAL.id);
  expect(fontes.obter).toHaveBeenNthCalledWith(2, jardimDoQuintal.id);
  expect(aguardarPrincipal).toHaveBeenCalledTimes(1);
  expect(aguardarQuintal).toHaveBeenCalledTimes(1);
});

test('uma execução posterior continua atualizando jardins depois de uma falha de rede', async () => {
  const sensor = new SensorFixo(leitura);
  const fontes: FontesDeJardim = { obter: jest.fn(async () => sensor) };
  const jardins = new RepositorioDeJardinsEmMemoria([PRINCIPAL_COM_SENSOR]);
  const atualizar = new AtualizarLeituras(jardins, fontes);
  const atualizarLeitura = jest.spyOn(sensor, 'atualizarLeitura');
  atualizarLeitura.mockRejectedValueOnce(new Error('rede indisponível'));

  await expect(atualizar.executar()).resolves.toEqual({ houveFalha: true });
  await atualizar.executar();

  expect(atualizarLeitura).toHaveBeenCalledTimes(2);
  expect(await sensor.lerLeituraAtual()).toEqual(leitura);
});

test('pede uma medição nova somente para o jardim solicitado', async () => {
  const jardimDoQuintal = { ...JARDIM_PRINCIPAL, id: 'quintal', nome: 'Quintal', idSensor: 'sensor-do-quintal' };
  const jardins = new RepositorioDeJardinsEmMemoria([PRINCIPAL_COM_SENSOR, jardimDoQuintal]);
  const sensorPrincipal = new SensorFixo(leitura);
  const sensorDoQuintal = new SensorFixo(leitura);
  const fontes: FontesDeJardim = {
    obter: jest.fn(async (id) => (id === JARDIM_PRINCIPAL.id ? sensorPrincipal : sensorDoQuintal)),
  };
  const atualizar = new AtualizarLeituras(jardins, fontes);
  const atualizarPrincipal = jest.spyOn(sensorPrincipal, 'atualizarLeitura');
  const atualizarQuintal = jest.spyOn(sensorDoQuintal, 'atualizarLeitura');

  await atualizar.executar(jardimDoQuintal.id);

  expect(atualizarPrincipal).not.toHaveBeenCalled();
  expect(atualizarQuintal).toHaveBeenCalledTimes(1);
});

test('jardim sem sensor não tem o que atualizar: não consulta fonte nenhuma e não conta como falha', async () => {
  const varanda = { ...JARDIM_PRINCIPAL, id: 'varanda', nome: 'Varanda', idSensor: null };
  const jardins = new RepositorioDeJardinsEmMemoria([PRINCIPAL_COM_SENSOR, varanda]);
  const sensor = new SensorFixo(leitura);
  const fontes: FontesDeJardim = { obter: jest.fn(async () => sensor) };
  const aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  const atualizar = new AtualizarLeituras(jardins, fontes);

  await expect(atualizar.executar()).resolves.toEqual({ houveFalha: false });
  await expect(atualizar.executar('varanda')).resolves.toEqual({ houveFalha: false });

  expect(fontes.obter).toHaveBeenCalledTimes(1);
  expect(fontes.obter).toHaveBeenCalledWith(PRINCIPAL_COM_SENSOR.id);
  expect(aviso).not.toHaveBeenCalled();
  aviso.mockRestore();
});

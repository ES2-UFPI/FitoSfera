import { AtualizarLeituras } from '@/aplicacao/casos-de-uso/AtualizarLeituras';
import { JARDIM_PRINCIPAL } from '@/dominio/modelos/Jardim';
import { Leitura } from '@/dominio/modelos/Leitura';
import { FontesDeJardim } from '@/dominio/portas/FontesDeJardim';
import { RepositorioDeJardinsEmMemoria, SensorFixo } from '../apoio/fakes';

const leitura: Leitura = {
  temperaturaCelsius: 24,
  umidadePercentual: 55,
  luminosidadeLux: 12000,
  medidaEm: new Date('2026-11-08T12:00:00Z'),
};

test('atualiza cada jardim sem deixar a falha de uma fonte interromper as demais', async () => {
  const jardimDoQuintal = { ...JARDIM_PRINCIPAL, id: 'quintal', nome: 'Quintal' };
  const jardins = new RepositorioDeJardinsEmMemoria([JARDIM_PRINCIPAL, jardimDoQuintal]);
  const sensorPrincipal = new SensorFixo(leitura);
  const sensorDoQuintal = new SensorFixo('falha');
  const fontes: FontesDeJardim = {
    obter: jest.fn(async (id) => (id === JARDIM_PRINCIPAL.id ? sensorPrincipal : sensorDoQuintal)),
  };
  const aguardarPrincipal = jest.spyOn(sensorPrincipal, 'aguardarLeitura');
  const aguardarQuintal = jest.spyOn(sensorDoQuintal, 'aguardarLeitura');
  const atualizar = new AtualizarLeituras(jardins, fontes);

  await expect(atualizar.executar()).resolves.toBeUndefined();

  expect(fontes.obter).toHaveBeenCalledTimes(2);
  expect(fontes.obter).toHaveBeenNthCalledWith(1, JARDIM_PRINCIPAL.id);
  expect(fontes.obter).toHaveBeenNthCalledWith(2, jardimDoQuintal.id);
  expect(aguardarPrincipal).toHaveBeenCalledTimes(1);
  expect(aguardarQuintal).toHaveBeenCalledTimes(1);
});

test('uma execução posterior continua atualizando jardins depois de uma falha de rede', async () => {
  const sensor = new SensorFixo(leitura);
  const fontes: FontesDeJardim = { obter: jest.fn(async () => sensor) };
  const jardins = new RepositorioDeJardinsEmMemoria();
  const atualizar = new AtualizarLeituras(jardins, fontes);
  const aguardar = jest.spyOn(sensor, 'aguardarLeitura');
  aguardar.mockRejectedValueOnce(new Error('rede indisponível'));

  await expect(atualizar.executar()).resolves.toBeUndefined();
  await atualizar.executar();

  expect(aguardar).toHaveBeenCalledTimes(2);
  expect(await sensor.lerLeituraAtual()).toEqual(leitura);
});

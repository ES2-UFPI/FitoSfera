import { AvaliarLeitura } from '@/aplicacao/casos-de-uso/AvaliarLeitura';
import { FontesDeJardim } from '@/dominio/portas/FontesDeJardim';
import { ID_JARDIM_PRINCIPAL } from '@/dominio/modelos/Planta';
import { NotificadorFalso, plantaDeTeste, RelogioParado,
  RepositorioDeAvisosEmMemoria, RepositorioDePlantasEmMemoria, SensorFixo } from '../apoio/fakes';

test('notifica cada planta só com o sensor de seu jardim', async () => {
  const agora = new Date(2026, 9, 22, 14);
  const plantas = new RepositorioDePlantasEmMemoria([
    plantaDeTeste({ id: 'p1', idJardim: ID_JARDIM_PRINCIPAL, apelido: 'Varanda' }),
    plantaDeTeste({ id: 'p2', idJardim: 'sala', apelido: 'Sala' }),
  ]);
  const normal = new SensorFixo({ umidadePercentual: 60, temperaturaCelsius: 24,
    luminosidadeLux: 9000, medidaEm: agora });
  const seco = new SensorFixo({ umidadePercentual: 10, temperaturaCelsius: 24,
    luminosidadeLux: 9000, medidaEm: agora });
  const fontes: FontesDeJardim = {
    obter: async (id) => id === 'sala' ? seco : normal,
  };
  const notificador = new NotificadorFalso(true);
  const uso = new AvaliarLeitura(plantas, normal, notificador, new RepositorioDeAvisosEmMemoria(),
    new RelogioParado(agora), fontes);
  expect((await uso.executar()).map((aviso) => aviso.idPlanta)).toEqual(['p2']);
});

test('com o sensor do jardim ainda conectando, espera a leitura dele para avisar', async () => {
  const agora = new Date(2026, 9, 22, 14);
  const plantas = new RepositorioDePlantasEmMemoria([plantaDeTeste({ id: 'p2', idJardim: 'sala', apelido: 'Sala' })]);
  const seco = new SensorFixo({ umidadePercentual: 10, temperaturaCelsius: 24, luminosidadeLux: 9000, medidaEm: agora });
  seco.entregarSoAoAguardar = true;
  const fontes: FontesDeJardim = { obter: async () => seco };
  const uso = new AvaliarLeitura(plantas, seco, new NotificadorFalso(true), new RepositorioDeAvisosEmMemoria(),
    new RelogioParado(agora), fontes);
  expect((await uso.executar()).map((aviso) => aviso.idPlanta)).toEqual(['p2']);
});

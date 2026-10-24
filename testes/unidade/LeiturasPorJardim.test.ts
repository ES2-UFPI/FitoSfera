import { ListarJardimVirtual } from '@/aplicacao/casos-de-uso/ListarJardimVirtual';
import { ObterPlantaDoJardim } from '@/aplicacao/casos-de-uso/ObterPlantaDoJardim';
import { FontesDeJardim } from '@/dominio/portas/FontesDeJardim';
import { ID_JARDIM_PRINCIPAL } from '@/dominio/modelos/Planta';
import { RepositorioDeEspeciesLocal } from '@/infraestrutura/catalogo/RepositorioDeEspeciesLocal';
import { plantaDeTeste, RelogioParado, RepositorioDePlantasEmMemoria, SensorFixo } from '../apoio/fakes';
import { ESPECIES_DE_TESTE } from '../apoio/especiesDeTeste';

test('lista e detalhe mostram somente plantas e leituras do jardim solicitado', async () => {
  const agora = new Date(2026, 9, 22, 14);
  const principal = new SensorFixo({ umidadePercentual: 55, temperaturaCelsius: 24,
    luminosidadeLux: 10000, medidaEm: agora });
  const sala = new SensorFixo({ umidadePercentual: 70, temperaturaCelsius: 19,
    luminosidadeLux: 500, medidaEm: agora });
  const fontes: FontesDeJardim = {
    obter: async (id) => id === 'sala' ? sala : principal,
  };
  const plantas = new RepositorioDePlantasEmMemoria([
    plantaDeTeste({ id: 'p1', idJardim: ID_JARDIM_PRINCIPAL }),
    plantaDeTeste({ id: 'p2', idJardim: 'sala', apelido: 'Da sala' }),
  ]);
  const catalogo = new RepositorioDeEspeciesLocal(ESPECIES_DE_TESTE);
  const relogio = new RelogioParado(agora);
  const listar = new ListarJardimVirtual(plantas, catalogo, principal, relogio, fontes);
  const obter = new ObterPlantaDoJardim(plantas, catalogo, principal, relogio, fontes);
  expect((await listar.executar('sala')).map((item) => [item.planta.id, item.ultimaLeitura?.umidadePercentual]))
    .toEqual([['p2', 70]]);
  expect((await listar.executar(ID_JARDIM_PRINCIPAL)).map((item) => [item.planta.id, item.ultimaLeitura?.umidadePercentual]))
    .toEqual([['p1', 55]]);
  expect(await obter.executar('p2', ID_JARDIM_PRINCIPAL)).toBeNull();
  expect((await obter.executar('p2', 'sala'))?.ultimaLeitura?.umidadePercentual).toBe(70);
});

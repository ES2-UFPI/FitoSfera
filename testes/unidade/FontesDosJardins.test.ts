import { JARDIM_PRINCIPAL } from '@/dominio/modelos/Jardim';
import { ObterPlantaDoJardim } from '@/aplicacao/casos-de-uso/ObterPlantaDoJardim';
import { RepositorioDeEspeciesLocal } from '@/infraestrutura/catalogo/RepositorioDeEspeciesLocal';
import { RepositorioDeJardinsAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeJardinsAsyncStorage';
import { CacheDeLeiturasAsyncStorage } from '@/infraestrutura/persistencia/CacheDeLeiturasAsyncStorage';
import { FontesDosJardins } from '@/infraestrutura/sensores/FontesDosJardins';
import { SensoresSimuladosDosJardins } from '@/infraestrutura/sensores/SensoresSimuladosDosJardins';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';
import { plantaDeTeste, RelogioParado, RepositorioDePlantasEmMemoria } from '../apoio/fakes';
import { ESPECIES_DE_TESTE } from '../apoio/especiesDeTeste';

test('sem associação não compartilha o sensor simulado com todos os jardins', async () => {
  const jardins = new RepositorioDeJardinsAsyncStorage(new ArmazenamentoEmMemoria());
  await jardins.salvar({ id: 'sala', nome: 'Sala', idSensor: null });
  const simulados = new SensoresSimuladosDosJardins(new RelogioParado(new Date(2026, 9, 22)));
  simulados.definirConfiguracao({ umidade: 'baixo', temperatura: 'automatico', luminosidade: 'automatico', desconectado: false }, JARDIM_PRINCIPAL.id);
  simulados.definirConfiguracao({ umidade: 'alto', temperatura: 'automatico', luminosidade: 'automatico', desconectado: false }, 'sala');
  const fontes = new FontesDosJardins(jardins, null, simulados);
  expect(await (await fontes.obter(JARDIM_PRINCIPAL.id)).lerLeituraAtual()).toBeNull();
  await jardins.salvar({ ...JARDIM_PRINCIPAL, idSensor: `simulado:${JARDIM_PRINCIPAL.id}` });
  expect(await (await fontes.obter(JARDIM_PRINCIPAL.id)).lerLeituraAtual()).toMatchObject({ umidadePercentual: 10 });
  await jardins.salvar({ id: 'sala', nome: 'Sala', idSensor: 'simulado:sala' });
  expect(await (await fontes.obter('sala')).lerLeituraAtual()).toMatchObject({ umidadePercentual: 90 });
});

test('enxerga a associação ao simulador feita depois da primeira consulta, mesmo com cache de leituras', async () => {
  const armazenamento = new ArmazenamentoEmMemoria();
  const jardins = new RepositorioDeJardinsAsyncStorage(armazenamento);
  await jardins.salvar({ ...JARDIM_PRINCIPAL, idSensor: null });
  const simulados = new SensoresSimuladosDosJardins(new RelogioParado(new Date(2026, 9, 22)));
  simulados.definirConfiguracao({ umidade: 'alto', temperatura: 'automatico', luminosidade: 'automatico', desconectado: false });
  const fontes = new FontesDosJardins(jardins, null, simulados, new CacheDeLeiturasAsyncStorage(armazenamento));

  expect(await (await fontes.obter(JARDIM_PRINCIPAL.id)).lerLeituraAtual()).toBeNull();
  await jardins.salvar({ ...JARDIM_PRINCIPAL, idSensor: `simulado:${JARDIM_PRINCIPAL.id}` });

  expect(await (await fontes.obter(JARDIM_PRINCIPAL.id)).lerLeituraAtual()).toMatchObject({ umidadePercentual: 90 });
});

test('usa o relógio virtual para marcar como desatualizado o cache quando o simulador está desconectado', async () => {
  const agora = new Date('2026-10-22T13:00:00Z');
  const armazenamento = new ArmazenamentoEmMemoria();
  const jardins = new RepositorioDeJardinsAsyncStorage(armazenamento);
  await jardins.salvar({ ...JARDIM_PRINCIPAL, idSensor: `simulado:${JARDIM_PRINCIPAL.id}` });
  const simulados = new SensoresSimuladosDosJardins(new RelogioParado(agora));
  const fontes = new FontesDosJardins(
    jardins,
    null,
    simulados,
    new CacheDeLeiturasAsyncStorage(armazenamento),
  );
  await (await fontes.obter(JARDIM_PRINCIPAL.id)).lerLeituraAtual();
  simulados.definirConfiguracao({
    umidade: 'automatico', temperatura: 'automatico', luminosidade: 'automatico', desconectado: true,
  }, JARDIM_PRINCIPAL.id);
  simulados.ajustarHorarioSimulado(31 * 60_000, JARDIM_PRINCIPAL.id);

  const detalle = new ObterPlantaDoJardim(
    new RepositorioDePlantasEmMemoria([plantaDeTeste()]),
    new RepositorioDeEspeciesLocal(ESPECIES_DE_TESTE),
    await fontes.obter(JARDIM_PRINCIPAL.id),
    new RelogioParado(agora),
    fontes,
  );
  const item = await detalle.executar('p1', JARDIM_PRINCIPAL.id);

  expect(item?.ultimaLeitura).not.toBeNull();
  expect(item?.leituraDesatualizada).toBe(true);
  expect(item?.status).toBe('sem-dados');
});

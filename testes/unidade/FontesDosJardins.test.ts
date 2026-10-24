import { JARDIM_PRINCIPAL } from '@/dominio/modelos/Jardim';
import { RepositorioDeJardinsAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeJardinsAsyncStorage';
import { FontesDosJardins } from '@/infraestrutura/sensores/FontesDosJardins';
import { SensoresSimuladosDosJardins } from '@/infraestrutura/sensores/SensoresSimuladosDosJardins';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';
import { RelogioParado } from '../apoio/fakes';

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

import { PeriodoDeLuz } from '@/dominio/regras/LuzRecebida';
import { criarContainerDeTeste, plantaDeTeste } from '../apoio/fakes';
import { FAIXAS_DE_TESTE } from '../apoio/especiesDeTeste';

/** Lux × minutos que equivalem a 1 mol/m² de luz do sol. */
const UM_MOL = 1_000_000 / (60 * 0.0185);
const agora = new Date(2026, 10, 10, 12, 0);
const manha: PeriodoDeLuz[] = [
  { inicio: new Date(2026, 10, 10, 6, 0), fim: new Date(2026, 10, 10, 12, 0), luxMinutos: 6 * UM_MOL, incompleta: false },
];

test('mede a luz de hoje do jardim da planta contra a meta de luz da planta', async () => {
  const { container } = criarContainerDeTeste({ agora, luz: { periodos: manha, ultimoContato: agora } });
  const planta = plantaDeTeste({ faixasRecomendadas: { ...FAIXAS_DE_TESTE, luzDiaria: { minimo: 10, maximo: 14 } } });

  const luz = await container.obterLuzDoDia.executar(planta);

  expect(luz.dli).toBeCloseTo(6);
  expect(luz.progresso).toBeCloseTo(0.6);
  expect(luz.incompleta).toBe(false);
});

test('planta sem meta de luz guardada usa a da espécie no catálogo', async () => {
  const { container } = criarContainerDeTeste({ agora, luz: { periodos: manha, ultimoContato: agora } });
  const { luzDiaria: _, ...semLuz } = FAIXAS_DE_TESTE;

  const luz = await container.obterLuzDoDia.executar(plantaDeTeste({ faixasRecomendadas: semLuz }));

  expect(luz.progresso).toBeCloseTo(6 / 12);
});

test('sem meta na planta nem no catálogo, não há progresso', async () => {
  const { container } = criarContainerDeTeste({ agora, luz: { periodos: manha, ultimoContato: agora } });

  const luz = await container.obterLuzDoDia.executar(plantaDeTeste({ idEspecie: 'sumiu', faixasRecomendadas: null }));

  expect(luz.progresso).toBeNull();
  expect(luz.dli).toBeCloseTo(6);
});

test('a luz de outro jardim não conta para a planta', async () => {
  const { container, luz: registro } = criarContainerDeTeste({ agora });
  registro.definir(manha, agora, 'varanda');

  const luz = await container.obterLuzDoDia.executar(plantaDeTeste());

  expect(luz).toMatchObject({ dli: 0, incompleta: true });
});

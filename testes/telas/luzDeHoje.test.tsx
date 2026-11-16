import { screen } from 'expo-router/testing-library';
import { act } from 'react';
import { Leitura } from '@/dominio/modelos/Leitura';
import { PeriodoDeLuz } from '@/dominio/regras/LuzRecebida';
import { INTERVALO_DA_LUZ_DE_HOJE_MS } from '@/apresentacao/componentes/CartaoDaLuzDeHoje';
import { plantaDeTeste, SensorFixo } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

/** Lux × minutos que equivalem a 1 mol/m² de luz do sol. A meta das plantas de teste é de 12 a 16 mol. */
const UM_MOL = 1_000_000 / (60 * 0.0185);
const meioDia = new Date(2026, 10, 10, 12, 0);

function manhaCom(mols: number, fim = meioDia): PeriodoDeLuz[] {
  return [{ inicio: new Date(2026, 10, 10, 6, 0), fim, luxMinutos: mols * UM_MOL, incompleta: false }];
}

function abrirDetalhe(luz: { periodos: PeriodoDeLuz[]; ultimoContato: Date | null }, opcoes = {}) {
  return renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora: meioDia, luz, ...opcoes });
}

test('abaixo da meta: mostra quanto da luz de hoje a planta já recebeu e que deve faltar luz', async () => {
  abrirDetalhe({ periodos: manhaCom(3), ultimoContato: meioDia });

  expect(await screen.findByRole('header', { name: 'Luz de hoje' })).toBeTruthy();
  expect(screen.getByText('25%')).toBeTruthy();
  expect(screen.getByText('da luz de hoje')).toBeTruthy();
  expect(screen.getByText('No ritmo de hoje, deve faltar luz para esta planta.')).toBeTruthy();
  expect(
    screen.getByLabelText('Luz de hoje: 25 por cento da luz de que a planta precisa. No ritmo de hoje, deve faltar luz para esta planta.'),
  ).toBeTruthy();
});

test('dentro da meta: diz que a planta deve receber a luz de que precisa', async () => {
  abrirDetalhe({ periodos: manhaCom(7), ultimoContato: meioDia });

  expect(await screen.findByText('58%')).toBeTruthy();
  expect(screen.getByText('No ritmo de hoje, a planta deve receber a luz de que precisa.')).toBeTruthy();
});

test('acima da meta: avisa que a planta deve receber luz demais', async () => {
  abrirDetalhe({ periodos: manhaCom(10), ultimoContato: meioDia });

  expect(await screen.findByText('83%')).toBeTruthy();
  expect(screen.getByText('No ritmo de hoje, a planta deve receber mais luz do que o recomendado.')).toBeTruthy();
});

test('cedo demais para projetar: mostra o progresso sem adivinhar como o dia termina', async () => {
  const cedo = new Date(2026, 10, 10, 7, 0);
  abrirDetalhe({ periodos: manhaCom(0.12, cedo), ultimoContato: cedo }, { agora: cedo });

  expect(await screen.findByText('1%')).toBeTruthy();
  expect(screen.getByText('Ainda é cedo para saber como o dia vai terminar.')).toBeTruthy();
});

test('dados incompletos: mostra o aviso no lugar da porcentagem, que pareceria falta de luz', async () => {
  const nove = new Date(2026, 10, 10, 9, 0);
  abrirDetalhe({ periodos: manhaCom(2, nove), ultimoContato: nove });

  expect(await screen.findByText('Dados de hoje incompletos')).toBeTruthy();
  expect(
    screen.getByText('O sensor ficou um tempo sem falar com o app, então parte da luz de hoje não foi contada.'),
  ).toBeTruthy();
  expect(screen.queryByText(/^\d+%$/)).toBeNull();
  expect(screen.queryByText(/deve faltar luz/)).toBeNull();
});

test('dados incompletos, mas a meta já foi alcançada: aí dá para mostrar a porcentagem', async () => {
  const dez = new Date(2026, 10, 10, 10, 0);
  abrirDetalhe({ periodos: manhaCom(13, dez), ultimoContato: dez });

  expect(await screen.findByText('108%')).toBeTruthy();
  expect(screen.getByText('Dados de hoje incompletos')).toBeTruthy();
  expect(screen.getByText('Mesmo com dados faltando, a planta já recebeu a luz mínima de hoje.')).toBeTruthy();
});

test('sem nenhuma medida de luz do sensor: diz isso, sem porcentagem', async () => {
  abrirDetalhe({ periodos: [], ultimoContato: null });

  expect(await screen.findByText('Ainda não chegou nenhuma medida de luz do sensor.')).toBeTruthy();
  expect(screen.queryByText(/^\d+%$/)).toBeNull();
});

test('planta sem meta de luz não mostra o cartão', async () => {
  renderizarApp({
    plantas: [plantaDeTeste({ idEspecie: 'sumiu', faixasRecomendadas: null })],
    url: '/planta/p1',
    agora: meioDia,
    luz: { periodos: manhaCom(3), ultimoContato: meioDia },
  });

  expect(await screen.findByRole('header', { name: 'Condições agora' })).toBeTruthy();
  expect(screen.queryByRole('header', { name: 'Luz de hoje' })).toBeNull();
});

test('uma leitura nova do sensor atualiza a luz de hoje', async () => {
  const leitura: Leitura = { umidadePercentual: 55, temperaturaCelsius: 24, luminosidadeLux: 30000, medidaEm: meioDia };
  const sensor = new SensorFixo(leitura);
  const { luz } = abrirDetalhe({ periodos: manhaCom(3), ultimoContato: meioDia }, { sensor });
  expect(await screen.findByText('25%')).toBeTruthy();

  luz.definir(manhaCom(7), meioDia);
  await act(async () => sensor.publicar(leitura));

  expect(await screen.findByText('58%')).toBeTruthy();
});

test('com a tela aberta e o sensor calado, o tempo passa e o dia passa a aparecer como incompleto', async () => {
  jest.useFakeTimers();
  try {
    const { relogio } = abrirDetalhe({ periodos: manhaCom(7), ultimoContato: meioDia });
    expect(await screen.findByText('58%')).toBeTruthy();

    relogio.avancar(30 * 60_000);
    await act(async () => {
      jest.advanceTimersByTime(INTERVALO_DA_LUZ_DE_HOJE_MS);
    });

    expect(await screen.findByText('Dados de hoje incompletos')).toBeTruthy();
    expect(screen.queryByText('58%')).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

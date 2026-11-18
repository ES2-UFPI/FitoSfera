import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { especieDeTeste } from '../apoio/especiesDeTeste';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

const agora = new Date(2026, 9, 17, 14, 0);
const tomate = especieDeTeste(
  { id: 'tomate', nomeComum: 'Tomate', nomeCientifico: 'Solanum lycopersicum', nomesAlternativos: [] },
  {
    frutifera: true,
    tempoMedioAteColheitaEmDias: 75,
    estagiosDeDesenvolvimento: [
      { nome: 'muda', duracaoEmDias: 10 },
      { nome: 'floração', duracaoEmDias: 20 },
      { nome: 'frutificação', duracaoEmDias: 45 },
    ],
  },
);

test('mostra prazo e estágio atual no detalhe de uma frutífera', async () => {
  renderizarApp({
    plantas: [plantaDeTeste({ cadastradaEm: new Date(2026, 9, 17, 14, 0), plantadaEm: new Date(2026, 9, 12, 14, 0) })],
    especies: [tomate],
    url: '/planta/p1',
    agora,
  });

  expect(await screen.findByRole('header', { name: 'Expectativa de colheita' })).toBeTruthy();
  expect(screen.getByText('Faltam cerca de 70 dias')).toBeTruthy();
  expect(screen.getByText('Estágio: muda')).toBeTruthy();
});

test('não mostra o bloco para uma espécie não frutífera', async () => {
  renderizarApp({ plantas: [plantaDeTeste({ idEspecie: 'jiboia' })], url: '/planta/p1', agora });
  await screen.findByRole('header', { name: 'Rega e histórico' });
  expect(screen.queryByRole('header', { name: 'Expectativa de colheita' })).toBeNull();
});

test('mostra estimativa indisponível quando faltam dados necessários', async () => {
  renderizarApp({
    plantas: [plantaDeTeste({ cadastradaEm: null })],
    especies: [tomate],
    url: '/planta/p1',
    agora,
  });

  expect(await screen.findByText('Estimativa indisponível')).toBeTruthy();
  expect(screen.queryByText(/Faltam cerca de/)).toBeNull();
});

test('sem data de plantio, explica o motivo e leva à edição, onde a data passa a ser gravada', async () => {
  const { plantas } = renderizarApp({
    plantas: [plantaDeTeste({ plantadaEm: null, colheitaIniciada: false })],
    especies: [tomate],
    url: '/planta/p1',
    agora,
  });

  expect(await screen.findByText('Estimativa indisponível')).toBeTruthy();
  expect(screen.getByText('Para prever a colheita, informe quando esta planta foi plantada.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Informar data do plantio' }));

  await waitFor(() => expect(screen).toHavePathname('/editar/p1/apelido'));
  expect((await screen.findByRole('radio', { name: 'Não sei quando foi plantada' })).props.accessibilityState.checked).toBe(
    true,
  );
  fireEvent.press(screen.getByRole('radio', { name: 'Informar data aproximada do plantio' }));
  fireEvent.changeText(screen.getByLabelText('Data aproximada do plantio'), '01/09/2026');
  fireEvent.press(screen.getByRole('button', { name: 'Salvar alterações' }));

  await waitFor(() => expect(plantas.salvas.at(-1)?.plantadaEm).toEqual(new Date(2026, 8, 1)));
});

test('mostra estimativa indisponível quando a espécie não tem ciclo médio cadastrado', async () => {
  renderizarApp({
    plantas: [plantaDeTeste({ plantadaEm: new Date(2026, 9, 1) })],
    especies: [{ ...tomate, tempoMedioAteColheitaEmDias: undefined }],
    url: '/planta/p1',
    agora,
  });

  expect(await screen.findByText('Estimativa indisponível')).toBeTruthy();
  expect(screen.getByText('Esta espécie ainda não tem o tempo médio até a colheita no catálogo.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Informar data do plantio' })).toBeNull();
  expect(screen.queryByText(/Faltam cerca de/)).toBeNull();
});

test('estima a leva atual a partir da data aproximada de início da floração', async () => {
  renderizarApp({
    plantas: [plantaDeTeste({
      plantadaEm: new Date(2026, 8, 1),
      colheitaIniciada: true,
      floracaoIniciadaEm: new Date(2026, 9, 1),
    })],
    especies: [tomate],
    url: '/planta/p1',
    agora,
  });

  expect(await screen.findByText('Faltam cerca de 49 dias')).toBeTruthy();
  expect(screen.getByText('Prazo calculado a partir do início aproximado desta floração.')).toBeTruthy();
});

test('sem data de início da floração, pede a referência necessária para prever a leva', async () => {
  renderizarApp({
    plantas: [plantaDeTeste({ colheitaIniciada: true, floracaoIniciadaEm: null })],
    especies: [tomate],
    url: '/planta/p1',
    agora,
  });

  expect(await screen.findByText('Em colheita')).toBeTruthy();
  expect(screen.getByText('Para prever a próxima leva, informe quando começou a floração atual.')).toBeTruthy();
});

test('usa o histórico ambiental guardado para ajustar o prazo exibido', async () => {
  const leituras = Array.from({ length: 16 }, (_, indice) => ({
    temperaturaCelsius: 40,
    umidadePercentual: 100,
    luminosidadeLux: 1000,
    medidaEm: new Date(agora.getTime() - 8 * 60 * 60_000 + indice * 30 * 60_000),
  }));
  renderizarApp({
    plantas: [plantaDeTeste({ plantadaEm: new Date(2026, 9, 12, 14, 0) })],
    especies: [tomate],
    historicoDeLeituras: { leituras },
    url: '/planta/p1',
    agora,
  });

  expect(await screen.findByText('Faltam cerca de 93 dias')).toBeTruthy();
});

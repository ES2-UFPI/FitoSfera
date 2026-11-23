import { act, fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { TOQUES_DO_CODIGO, PAUSA_MAXIMA_ENTRE_TOQUES_MS } from '@/apresentacao/demonstracao/codigoDaDemonstracao';
import { JARDIM_PRINCIPAL } from '@/dominio/modelos/Jardim';
import { renderizarApp } from './apoio/renderizarApp';

const AGORA = new Date(2026, 10, 17, 8, 30);
const COM_SENSOR = [{ ...JARDIM_PRINCIPAL, idSensor: 'AA:BB:CC:DD:EE:FF' }];

function abaAjustes() {
  return screen.getByLabelText(/^Ajustes, tab/);
}

async function tocarNaAba(vezes: number) {
  for (let toque = 0; toque < vezes; toque += 1) {
    await act(async () => {
      fireEvent.press(abaAjustes());
    });
  }
}

beforeEach(() => {
  jest.useFakeTimers({ now: AGORA, doNotFake: ['nextTick', 'setImmediate'] });
});

afterEach(() => {
  jest.useRealTimers();
});

test(`${TOQUES_DO_CODIGO} toques no botão Ajustes mostram o modo de demonstração, sem aviso antes disso`, async () => {
  renderizarApp({ jardins: COM_SENSOR, agora: AGORA });
  await screen.findByLabelText(/^Ajustes, tab/);

  await tocarNaAba(TOQUES_DO_CODIGO - 1);
  expect(screen.queryByText('Modo de demonstração')).toBeNull();

  await tocarNaAba(1);
  expect(await screen.findByText('Modo de demonstração')).toBeTruthy();
});

test('uma pausa longa entre os toques recomeça o código', async () => {
  renderizarApp({ jardins: COM_SENSOR, agora: AGORA });
  await screen.findByLabelText(/^Ajustes, tab/);

  await tocarNaAba(TOQUES_DO_CODIGO - 5);
  act(() => jest.advanceTimersByTime(PAUSA_MAXIMA_ENTRE_TOQUES_MS + 1));
  await tocarNaAba(5);

  expect(screen.queryByText('Modo de demonstração')).toBeNull();
});

test('o botão preenche a luz desde as 7h com o sensor de verdade', async () => {
  const { luz } = renderizarApp({ jardins: COM_SENSOR, agora: AGORA });
  luz.definirMarca({ idReinicio: 3, luzAcumuladaLuxMinutos: 500, medidaEm: new Date(2026, 10, 17, 8, 0) });
  await screen.findByLabelText(/^Ajustes, tab/);
  await tocarNaAba(TOQUES_DO_CODIGO);

  fireEvent.press(await screen.findByRole('button', { name: 'Simular sol desde as 7h' }));

  expect(await screen.findByText('Pronto: a luz de hoje começa às 7h.')).toBeTruthy();
  expect((await luz.listar(JARDIM_PRINCIPAL.id)).length).toBe(12);
});

test('sem leitura do sensor hoje, explica o que fazer', async () => {
  renderizarApp({ jardins: COM_SENSOR, agora: AGORA });
  await screen.findByLabelText(/^Ajustes, tab/);
  await tocarNaAba(TOQUES_DO_CODIGO);

  fireEvent.press(await screen.findByRole('button', { name: 'Simular sol desde as 7h' }));

  expect(await screen.findByText('Ligue o sensor e espere a primeira leitura de hoje.')).toBeTruthy();
});

test('sem sensor no jardim, o botão fica desligado e diz por quê', async () => {
  renderizarApp({ agora: AGORA });
  await screen.findByLabelText(/^Ajustes, tab/);
  await tocarNaAba(TOQUES_DO_CODIGO);

  expect(await screen.findByRole('button', { name: 'Simular sol desde as 7h' })).toBeDisabled();
  expect(screen.getByText('Associe o sensor a este jardim para usar a demonstração.')).toBeTruthy();
});

test('"Desligar o modo" esconde o cartão', async () => {
  renderizarApp({ jardins: COM_SENSOR, agora: AGORA });
  await screen.findByLabelText(/^Ajustes, tab/);
  await tocarNaAba(TOQUES_DO_CODIGO);

  fireEvent.press(await screen.findByRole('button', { name: 'Desligar o modo' }));

  await waitFor(() => expect(screen.queryByText('Modo de demonstração')).toBeNull());
});

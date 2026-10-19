import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { CORES } from '@/apresentacao/tema/cores';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

test('tocar no vaso abre o detalhe e informa quando ainda não há leitura', async () => {
  renderizarApp({ plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'tomate', apelido: 'Tomatinho' })] });
  fireEvent.press(await screen.findByLabelText('Tomatinho. Sem dados. Toque para ver os detalhes.'));
  expect(screen).toHavePathname('/planta/p1');
  expect(await screen.findByRole('header', { name: 'Tomatinho' })).toBeTruthy();
  expect(screen.getByText('Tomate')).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Condições agora' })).toBeTruthy();
  expect(screen.getByText('Nenhuma leitura disponível ainda.')).toBeTruthy();
  expect(screen.queryByText('DADOS DE DEMONSTRAÇÃO')).toBeNull();
});

test('espécie fora do catálogo mostra "Espécie desconhecida"', async () => {
  renderizarApp({
    plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'sumiu', apelido: 'Misteriosa' })],
    url: '/planta/p1',
  });
  expect(await screen.findByText('Espécie desconhecida')).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Misteriosa' })).toBeTruthy();
});

test('id inexistente mostra "Planta não encontrada"', async () => {
  renderizarApp({ url: '/planta/p9' });
  expect(await screen.findByText('Planta não encontrada')).toBeTruthy();
});

test('uma leitura real mostra o horário medido e substitui os dados de demonstração', async () => {
  const medidaEm = new Date(2026, 9, 17, 13, 55);
  renderizarApp({
    plantas: [plantaDeTeste()],
    url: '/planta/p1',
    agora: new Date(2026, 9, 17, 14, 0),
    leitura: { umidadePercentual: 61, temperaturaCelsius: 25, luminosidadeLux: 9000, medidaEm },
  });

  expect(await screen.findByText('Última leitura às 13:55')).toBeTruthy();
  expect(screen.queryByText('DADOS DE DEMONSTRAÇÃO')).toBeNull();
  expect(screen.getByLabelText('Umidade: 61 por cento. Faixa ideal: 40 a 70 por cento. Dentro do ideal.')).toBeTruthy();
});

test('leitura mais antiga que 30 minutos continua visível e aparece como desatualizada', async () => {
  renderizarApp({
    plantas: [plantaDeTeste()],
    url: '/planta/p1',
    agora: new Date(2026, 9, 17, 14, 0),
    leitura: {
      umidadePercentual: 58,
      temperaturaCelsius: 24,
      luminosidadeLux: 720,
      medidaEm: new Date(2026, 9, 17, 13, 29),
    },
  });

  expect(await screen.findByText('Última leitura às 13:29')).toBeTruthy();
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByText('Leitura desatualizada')).toBeTruthy();
  expect(screen.getByLabelText('Umidade: 58 por cento. Faixa ideal: 40 a 70 por cento.')).toBeTruthy();
});

test('registrar uma rega grava o horário atual e mostra uma confirmação', async () => {
  const agora = new Date(2026, 9, 18, 15, 30);
  const { regas } = renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora });
  const botao = await screen.findByRole('button', { name: 'Registrar rega' });
  expect(botao).toHaveStyle({ backgroundColor: CORES.acaoRega });
  expect(screen.getByTestId('icone-rega')).toBeTruthy();

  fireEvent.press(botao);

  expect(await screen.findByText('✓ Rega registrada agora.')).toBeTruthy();
  expect(regas.salvas).toHaveLength(1);
  expect(regas.salvas[0]).toMatchObject({ idPlanta: 'p1', regadaEm: agora });
});

test('toques repetidos enquanto registra criam apenas uma rega', async () => {
  const { regas } = renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1' });
  const botao = await screen.findByRole('button', { name: 'Registrar rega' });

  fireEvent.press(botao);
  fireEvent.press(botao);

  await waitFor(() => expect(regas.salvas).toHaveLength(1));
  expect(await screen.findByText('✓ Rega registrada agora.')).toBeTruthy();
});

test('falha ao registrar mostra uma mensagem e libera uma nova tentativa', async () => {
  renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', falharAoRegistrarRega: true });
  fireEvent.press(await screen.findByRole('button', { name: 'Registrar rega' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Não deu para registrar a rega. Tente novamente.');
  expect(screen.getByRole('button', { name: 'Registrar rega' }).props.accessibilityState.disabled).toBe(false);
});

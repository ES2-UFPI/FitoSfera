import { fireEvent, screen } from 'expo-router/testing-library';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

test('tocar no vaso abre o detalhe com apelido, espécie e a prévia do painel', async () => {
  renderizarApp({ plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'tomate', apelido: 'Tomatinho' })] });
  fireEvent.press(await screen.findByLabelText('Tomatinho. Sem dados. Toque para ver os detalhes.'));
  expect(screen).toHavePathname('/planta/p1');
  expect(await screen.findByRole('header', { name: 'Tomatinho' })).toBeTruthy();
  expect(screen.getByText('Tomate')).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Condições agora' })).toBeTruthy();
  expect(screen.getByText('DADOS DE DEMONSTRAÇÃO')).toBeTruthy();
  expect(screen.getByLabelText('Umidade: 58 por cento. Faixa ideal: 40 a 70 por cento.')).toBeTruthy();
  expect(screen.getByLabelText('Temperatura: 24 graus Celsius. Faixa ideal: 18 a 28 graus Celsius.')).toBeTruthy();
  expect(screen.getByLabelText('Luz: 720 lux. Faixa ideal: 5000 a 20000 lux.')).toBeTruthy();
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
  expect(screen.getByLabelText('Umidade: 61 por cento. Faixa ideal: 40 a 70 por cento.')).toBeTruthy();
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

import { screen } from 'expo-router/testing-library';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

/** As plantas de teste têm, de dia, 18–28 °C e 40–70%; à noite, 13–23 °C e 40–80%. */
const leituraDaNoite = {
  umidadePercentual: 78,
  temperaturaCelsius: 16,
  luminosidadeLux: 0,
  medidaEm: new Date(2026, 10, 15, 22, 5),
};

test('à noite, o detalhe compara com as faixas da noite e não acusa falta de luz', async () => {
  renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora: new Date(2026, 10, 15, 22, 10), leitura: leituraDaNoite });

  expect(await screen.findByText('Ideal à noite: 13–23 °C')).toBeTruthy();
  expect(screen.getByText('☾ Noite')).toBeTruthy();
  expect(screen.queryByText(/Abaixo do ideal/)).toBeNull();
  expect(screen.queryByText('Precisa de atenção')).toBeNull();
});

test('à noite, a estante não marca atenção só porque está escuro', async () => {
  renderizarApp({ plantas: [plantaDeTeste()], agora: new Date(2026, 10, 15, 22, 10), leitura: leituraDaNoite });

  expect(await screen.findByLabelText(/^Tomatinho\. (?!Precisa de atenção)/)).toBeTruthy();
});

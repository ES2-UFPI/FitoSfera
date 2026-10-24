import { fireEvent, screen } from 'expo-router/testing-library';
import { PareamentoDoSensor } from '@/aplicacao/portas/PareamentoDoSensor';
import { renderizarApp } from './apoio/renderizarApp';

const sensor = { id: 'ble-01', nome: 'FitoSfera' };
const pareamento: PareamentoDoSensor = {
  pedirPermissoes: async () => true,
  procurar: () => () => undefined,
  parear: async () => ({ umidadePercentual: 55, temperaturaCelsius: 24, luminosidadeLux: 900, medidaEm: new Date() }),
  obterPareado: async () => sensor,
  listarPareados: async () => [sensor],
  esquecer: async () => undefined,
};

test('os cartões do jardim e do sensor começam fechados, com a seta para baixo', async () => {
  renderizarApp({ pareamentoDoSensor: pareamento });

  expect(await screen.findByRole('button', { name: 'Mostrar opções do jardim' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Mostrar opções do sensor' })).toBeTruthy();
  expect(screen.getAllByTestId('seta-para-baixo', { includeHiddenElements: true })).toHaveLength(2);
  expect(screen.queryByRole('button', { name: 'Trocar ou criar jardim' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Associar sensor físico' })).toBeNull();
});

test('tocar no jardim abre só as opções do jardim, e tocar de novo fecha', async () => {
  renderizarApp({ pareamentoDoSensor: pareamento });

  fireEvent.press(await screen.findByRole('button', { name: 'Mostrar opções do jardim' }));

  expect(screen.getByRole('button', { name: 'Trocar ou criar jardim' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Ocultar opções do jardim' })).toHaveProp('accessibilityState', {
    expanded: true,
  });
  expect(screen.getAllByTestId('seta-para-cima', { includeHiddenElements: true })).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Associar sensor físico' })).toBeNull();

  fireEvent.press(screen.getByRole('button', { name: 'Ocultar opções do jardim' }));
  expect(screen.queryByRole('button', { name: 'Trocar ou criar jardim' })).toBeNull();
});

test('o botão do dropdown do jardim abre a escolha de jardins', async () => {
  renderizarApp({ pareamentoDoSensor: pareamento });

  fireEvent.press(await screen.findByRole('button', { name: 'Mostrar opções do jardim' }));
  fireEvent.press(screen.getByRole('button', { name: 'Trocar ou criar jardim' }));

  expect(await screen.findByRole('header', { name: 'Seus jardins' })).toBeTruthy();
});

test('tocar no sensor abre as opções do sensor com a seta para cima', async () => {
  renderizarApp({ pareamentoDoSensor: pareamento });

  fireEvent.press(await screen.findByRole('button', { name: 'Mostrar opções do sensor' }));

  expect(await screen.findByRole('button', { name: 'Associar sensor físico' })).toBeTruthy();
  expect(screen.getAllByTestId('seta-para-cima', { includeHiddenElements: true })).toHaveLength(1);
});

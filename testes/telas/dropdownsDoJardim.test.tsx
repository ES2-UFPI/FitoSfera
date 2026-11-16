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

test('o cartão do sensor começa fechado e o do jardim mostra o jardim atual, com a seta para baixo', async () => {
  renderizarApp({ pareamentoDoSensor: pareamento });

  expect(await screen.findByRole('button', { name: 'Trocar ou criar jardim' })).toHaveProp(
    'accessibilityHint',
    'Jardim atual: Jardim principal',
  );
  expect(screen.getByRole('button', { name: 'Mostrar opções do sensor' })).toBeTruthy();
  expect(screen.getAllByTestId('seta-para-baixo', { includeHiddenElements: true })).toHaveLength(2);
  expect(screen.queryByRole('button', { name: 'Parear novo sensor' })).toBeNull();
});

test('tocar no jardim abre direto a escolha de jardins', async () => {
  renderizarApp({ pareamentoDoSensor: pareamento });

  fireEvent.press(await screen.findByRole('button', { name: 'Trocar ou criar jardim' }));

  expect(await screen.findByRole('header', { name: 'Seus jardins' })).toBeTruthy();
});

test('tocar no sensor já mostra os sensores pareados e o pareamento, com a seta para cima', async () => {
  renderizarApp({ pareamentoDoSensor: pareamento });

  fireEvent.press(await screen.findByRole('button', { name: 'Mostrar opções do sensor' }));

  expect(await screen.findByRole('button', { name: 'Usar FitoSfera · le-01' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Parear novo sensor' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Ocultar opções do sensor' })).toHaveProp('accessibilityState', {
    expanded: true,
  });
  expect(screen.getAllByTestId('seta-para-cima', { includeHiddenElements: true })).toHaveLength(1);

  fireEvent.press(screen.getByRole('button', { name: 'Ocultar opções do sensor' }));
  expect(screen.queryByRole('button', { name: 'Parear novo sensor' })).toBeNull();
});

import { screen } from 'expo-router/testing-library';
import { Text } from 'react-native';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

let mockFontScale = 1;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 360, height: 640, scale: 2, fontScale: mockFontScale }),
}));

afterEach(() => {
  mockFontScale = 1;
});

const agora = new Date(2026, 9, 17, 14, 0);
const leituraIdeal = {
  umidadePercentual: 60,
  temperaturaCelsius: 24,
  luminosidadeLux: 12000,
  medidaEm: new Date(2026, 9, 17, 13, 55),
};

test('o leitor de tela percorre planta, condições, rega e histórico e, por fim, as ações', async () => {
  renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora, leitura: leituraIdeal });
  await screen.findByRole('header', { name: 'Rega e histórico' });

  expect(screen.getAllByRole('header').map((cabecalho) => cabecalho.props.children)).toEqual([
    'Tomatinho',
    'Condições agora',
    'Rega e histórico',
  ]);
  expect(screen.getAllByRole('button').map((botao) => botao.props.accessibilityLabel)).toEqual([
    'Voltar',
    'Registrar rega',
    'Ver todas as regas',
    'Editar',
    'Excluir',
  ]);
});

test('o status da planta aparece logo abaixo do nome, por texto', async () => {
  renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora, leitura: leituraIdeal });
  expect(await screen.findByLabelText('Status: Ok.')).toBeTruthy();
});

test('sem leitura, o status diz "Sem dados"', async () => {
  renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora });
  expect(await screen.findByLabelText('Status: Sem dados.')).toBeTruthy();
});

test('nenhum texto do detalhe é cortado nem deixa de acompanhar a fonte do sistema', async () => {
  renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora, leitura: leituraIdeal });
  await screen.findByRole('header', { name: 'Rega e histórico' });

  const textos = screen.UNSAFE_getAllByType(Text);
  expect(textos.length).toBeGreaterThan(0);
  for (const texto of textos) {
    expect(texto.props.numberOfLines).toBeUndefined();
    expect(texto.props.allowFontScaling).not.toBe(false);
  }
});

test('com fonte grande, os indicadores das condições ficam um embaixo do outro', async () => {
  mockFontScale = 1.5;
  renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora, leitura: leituraIdeal });

  expect(await screen.findByTestId('indicadores-das-condicoes')).toHaveStyle({ flexDirection: 'column' });
});

test('com fonte padrão, os indicadores ficam lado a lado', async () => {
  renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora, leitura: leituraIdeal });

  expect(await screen.findByTestId('indicadores-das-condicoes')).toHaveStyle({ flexDirection: 'row' });
});

import { render, screen } from '@testing-library/react-native';
import { PainelDeCondicoes } from '@/apresentacao/componentes/PainelDeCondicoes';

const leitura = {
  umidadePercentual: 58,
  temperaturaCelsius: 24.5,
  luminosidadeLux: 720,
};

test('mostra as três grandezas com suas unidades e identifica dados de demonstração', () => {
  render(<PainelDeCondicoes estado={{ tipo: 'leitura', leitura, demonstracao: true }} />);

  expect(screen.getByRole('header', { name: 'Condições agora' })).toBeTruthy();
  expect(screen.getByText('DADOS DE DEMONSTRAÇÃO')).toBeTruthy();
  expect(screen.getByLabelText('Umidade: 58 por cento.')).toBeTruthy();
  expect(screen.getByLabelText('Temperatura: 24,5 graus Celsius.')).toBeTruthy();
  expect(screen.getByLabelText('Luz: 720 lux.')).toBeTruthy();
  expect(screen.getByTestId('icone-umidade')).toBeTruthy();
  expect(screen.getByTestId('icone-temperatura')).toBeTruthy();
  expect(screen.getByTestId('icone-luz')).toBeTruthy();
});

test('avisa por texto quando a leitura está desatualizada', () => {
  render(<PainelDeCondicoes estado={{ tipo: 'leitura', leitura, desatualizada: true }} />);

  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByText('Leitura desatualizada')).toBeTruthy();
  expect(screen.getByLabelText('Umidade: 58 por cento.')).toBeTruthy();
  expect(screen.getByLabelText('Temperatura: 24,5 graus Celsius.')).toBeTruthy();
  expect(screen.getByLabelText('Luz: 720 lux.')).toBeTruthy();
});

test('mostra o estado de carregamento sem inventar valores', () => {
  render(<PainelDeCondicoes estado={{ tipo: 'carregando' }} />);

  expect(screen.getByText('Buscando as condições da planta…')).toBeTruthy();
  expect(screen.queryByText('UMIDADE')).toBeNull();
});

test('explica quando o sensor está indisponível', () => {
  render(<PainelDeCondicoes estado={{ tipo: 'indisponivel' }} />);

  expect(screen.getByText('O sensor ainda não está disponível nesta versão.')).toBeTruthy();
  expect(screen.queryByText('DADOS DE DEMONSTRAÇÃO')).toBeNull();
});

test('distingue a ausência de leituras de um sensor indisponível', () => {
  render(<PainelDeCondicoes estado={{ tipo: 'sem-leitura' }} />);

  expect(screen.getByText('Nenhuma leitura disponível ainda.')).toBeTruthy();
  expect(screen.queryByText('O sensor ainda não está disponível nesta versão.')).toBeNull();
  expect(screen.queryByText('UMIDADE')).toBeNull();
});

test('mantém a leitura visível enquanto uma atualização está em andamento', () => {
  render(<PainelDeCondicoes estado={{ tipo: 'leitura', leitura, atualizando: true }} />);

  expect(screen.getByText('Atualizando condições…')).toBeTruthy();
  expect(screen.getByLabelText('Umidade: 58 por cento.')).toBeTruthy();
  expect(screen.getByLabelText('Temperatura: 24,5 graus Celsius.')).toBeTruthy();
  expect(screen.getByLabelText('Luz: 720 lux.')).toBeTruthy();
});

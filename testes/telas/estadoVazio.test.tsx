import { fireEvent, screen } from 'expo-router/testing-library';
import { renderizarApp } from './apoio/renderizarApp';

test('jardim vazio convida a montar a primeira planta', async () => {
  renderizarApp();
  expect(await screen.findByText('Monte sua primeira planta')).toBeTruthy();
  expect(screen.getByText('Busque pelo nome, escolha a forma e as cores, e dê um apelido carinhoso.')).toBeTruthy();
  expect(screen.getByText('Ainda sem plantas por aqui')).toBeTruthy();
  ['busque', 'monte', 'batize'].forEach((passo) => expect(screen.getByText(passo)).toBeTruthy());
});

test('jardim vazio não mostra a estante nem o botão Nova planta', async () => {
  renderizarApp();
  await screen.findByText('Monte sua primeira planta');
  expect(screen.queryByRole('button', { name: 'Nova planta' })).toBeNull();
  expect(screen.queryByTestId('estante')).toBeNull();
});

test('"Começar" leva ao cadastro', async () => {
  renderizarApp();
  fireEvent.press(await screen.findByRole('button', { name: '＋ Começar' }));
  expect(screen).toHavePathname('/cadastro');
  await screen.findAllByTestId('resultado-especie');
});

test('o "+" do vaso do meio também leva ao cadastro', async () => {
  renderizarApp();
  fireEvent.press(await screen.findByLabelText('Cadastrar a primeira planta'));
  expect(screen).toHavePathname('/cadastro');
  await screen.findAllByTestId('resultado-especie');
});

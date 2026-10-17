import { fireEvent, screen, within } from 'expo-router/testing-library';
import { renderizarApp } from './apoio/renderizarApp';

async function nomesListados() {
  const resultados = await screen.findAllByTestId('resultado-especie');
  return resultados.map((resultado) => within(resultado).getByTestId('nome-comum').props.children);
}

test('com a busca vazia lista o catálogo em ordem alfabética', async () => {
  renderizarApp({ url: '/cadastro' });
  expect(await nomesListados()).toEqual(['Alface', 'Espada-de-são-jorge', 'Jiboia', 'Lavanda', 'Tomate']);
});

test('"sao jorge" encontra a Espada-de-são-jorge', async () => {
  renderizarApp({ url: '/cadastro' });
  fireEvent.changeText(await screen.findByPlaceholderText('Nome da planta'), 'sao jorge');
  await screen.findByText('Dracaena trifasciata');
  expect(await nomesListados()).toEqual(['Espada-de-são-jorge']);
});

test('sem resultado mostra a mensagem do catálogo', async () => {
  renderizarApp({ url: '/cadastro' });
  fireEvent.changeText(await screen.findByPlaceholderText('Nome da planta'), 'xyzw');
  expect(await screen.findByText('Não encontramos essa planta no catálogo.')).toBeTruthy();
});

test('tocar numa espécie avança para o passo 2', async () => {
  renderizarApp({ url: '/cadastro' });
  fireEvent.press(await screen.findByRole('button', { name: 'Tomate' }));
  expect(screen).toHavePathname('/cadastro/aparencia');
});

test('o cabeçalho do cadastro marca o passo 1 de 3', async () => {
  renderizarApp({ url: '/cadastro' });
  expect(await screen.findByLabelText('Passo 1 de 3')).toBeTruthy();
  await screen.findAllByTestId('resultado-especie');
});

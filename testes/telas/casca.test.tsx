import { screen } from 'expo-router/testing-library';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

test('o jardim mostra o título e a quantidade de plantas', async () => {
  renderizarApp({ plantas: [plantaDeTeste({ id: 'p1' }), plantaDeTeste({ id: 'p2' })] });
  expect(await screen.findByText('Seu cantinho verde')).toBeTruthy();
  expect(await screen.findByText('2 plantas na sua estante')).toBeTruthy();
});

test('a aba Ambiente mostra "Em breve"', async () => {
  renderizarApp({ url: '/ambiente' });
  expect(await screen.findByText('Em breve')).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Ambiente' })).toBeTruthy();
});

test('a aba Ajustes mostra "Em breve"', async () => {
  renderizarApp({ url: '/ajustes' });
  expect(await screen.findByText('Em breve')).toBeTruthy();
});

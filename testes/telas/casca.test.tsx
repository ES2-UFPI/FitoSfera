import { screen } from 'expo-router/testing-library';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

test('o jardim mostra o título e a quantidade de plantas', async () => {
  renderizarApp({ plantas: [plantaDeTeste({ id: 'p1' }), plantaDeTeste({ id: 'p2' })] });
  expect(await screen.findByText('Seu cantinho verde')).toBeTruthy();
  expect(await screen.findByText('2 plantas na sua estante')).toBeTruthy();
});

test('a aba Ambiente fica escondida da barra de abas, mas a tela continua no app', async () => {
  renderizarApp();
  expect(await screen.findByText('Seu cantinho verde')).toBeTruthy();
  expect(screen.getByText('Jardim')).toBeTruthy();
  expect(screen.getByText('Ajustes')).toBeTruthy();
  expect(screen.queryByText('Ambiente')).toBeNull();
});

test('a tela Ambiente, escondida da barra, ainda mostra "Em breve" pelo endereço', async () => {
  renderizarApp({ url: '/ambiente' });
  expect(await screen.findByText('Em breve')).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Ambiente' })).toBeTruthy();
});

test('a aba Ajustes mostra "Em breve"', async () => {
  renderizarApp({ url: '/ajustes' });
  expect(await screen.findByText('Em breve')).toBeTruthy();
});

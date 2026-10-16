import { fireEvent, screen } from 'expo-router/testing-library';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

test('tocar no vaso abre o detalhe com apelido, espécie e o aviso', async () => {
  renderizarApp({ plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'tomate', apelido: 'Tomatinho' })] });
  fireEvent.press(await screen.findByLabelText('Tomatinho. Toque para ver os detalhes.'));
  expect(screen).toHavePathname('/planta/p1');
  expect(await screen.findByRole('header', { name: 'Tomatinho' })).toBeTruthy();
  expect(screen.getByText('Tomate')).toBeTruthy();
  expect(screen.getByText('Os detalhes desta planta chegam em breve.')).toBeTruthy();
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

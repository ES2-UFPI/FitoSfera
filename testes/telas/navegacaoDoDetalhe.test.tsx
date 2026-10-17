import { fireEvent, screen } from 'expo-router/testing-library';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

const variasPlantas = (quantidade: number) =>
  Array.from({ length: quantidade }, (_, i) => plantaDeTeste({ id: `p${i + 1}`, apelido: `Planta ${i + 1}` }));

// A posição de rolagem fica guardada na própria estante: se ela não for remontada, a rolagem volta igual.
test('voltar do detalhe devolve o jardim com a mesma estante, sem remontar', async () => {
  renderizarApp({ plantas: variasPlantas(9) });
  const estanteAntes = await screen.findByTestId('estante');

  fireEvent.press(screen.getByLabelText('Planta 8. Sem dados. Toque para ver os detalhes.'));
  expect(await screen.findByRole('header', { name: 'Planta 8' })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));

  expect(screen).toHavePathname('/');
  expect(await screen.findByTestId('estante')).toBe(estanteAntes);
});

test('"Voltar" no detalhe aberto direto pelo link leva ao jardim', async () => {
  renderizarApp({ plantas: [plantaDeTeste({ id: 'p1', apelido: 'Tomatinho' })], url: '/planta/p1' });
  await screen.findByRole('header', { name: 'Tomatinho' });
  fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
  expect(screen).toHavePathname('/');
  expect(await screen.findByLabelText('Tomatinho. Sem dados. Toque para ver os detalhes.')).toBeTruthy();
});

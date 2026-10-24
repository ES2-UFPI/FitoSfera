import { act, screen } from 'expo-router/testing-library';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

const toqueEm = (idPlanta: string, idDaNotificacao = 'n1') => ({ idPlanta, idDaNotificacao });

test('o toque que abre o app fechado leva direto ao detalhe da planta citada', async () => {
  renderizarApp({
    plantas: [plantaDeTeste({ id: 'p1', apelido: 'Tomatinho' })],
    toqueDeAbertura: toqueEm('p1'),
  });

  expect(await screen.findByRole('header', { name: 'Tomatinho' })).toBeTruthy();
  expect(screen).toHavePathname('/planta/p1');
});

test('o toque com o app aberto no jardim leva ao detalhe da planta citada', async () => {
  const { toques } = renderizarApp({ plantas: [plantaDeTeste({ id: 'p1', apelido: 'Tomatinho' })] });
  await screen.findByLabelText('Tomatinho. Sem dados. Toque para ver os detalhes.');

  act(() => toques.tocar(toqueEm('p1')));

  expect(await screen.findByRole('header', { name: 'Tomatinho' })).toBeTruthy();
  expect(screen).toHavePathname('/planta/p1');
});

test('planta já excluída mostra a mensagem, e não uma tela quebrada', async () => {
  renderizarApp({ plantas: [], toqueDeAbertura: toqueEm('sumiu') });

  expect(await screen.findByText('Planta não encontrada')).toBeTruthy();
  expect(screen.getByText('Ela pode ter saído da sua estante.')).toBeTruthy();
  expect(screen).toHavePathname('/planta/sumiu');
});

test('o mesmo toque chegando pelas duas vias abre o detalhe uma vez só', async () => {
  const { toques } = renderizarApp({
    plantas: [plantaDeTeste({ id: 'p1', apelido: 'Tomatinho' })],
    toqueDeAbertura: toqueEm('p1', 'n5'),
  });
  await screen.findByRole('header', { name: 'Tomatinho' });

  act(() => toques.tocar(toqueEm('p1', 'n5')));

  // Com a tela empilhada duas vezes, o apelido apareceria em duplicidade.
  expect(screen.getAllByRole('header', { name: 'Tomatinho' })).toHaveLength(1);
});

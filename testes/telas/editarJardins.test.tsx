import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { JARDIM_PRINCIPAL } from '@/dominio/modelos/Jardim';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

const VARANDA = { id: 'varanda', nome: 'Varanda', idSensor: null };

function abrirSeletor() {
  fireEvent.press(screen.getByRole('button', { name: 'Trocar ou criar jardim' }));
}

test('renomear um jardim troca o nome na lista e no cartão do jardim aberto', async () => {
  const { container } = renderizarApp({ jardins: [JARDIM_PRINCIPAL, VARANDA] });
  await screen.findByText('Jardim principal');
  abrirSeletor();

  fireEvent.press(screen.getByRole('button', { name: 'Editar o jardim Jardim principal' }));
  expect(screen.getByRole('header', { name: 'Editar jardim' })).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('Nome do jardim'), '  Quintal  ');
  fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

  expect(await screen.findByRole('header', { name: 'Seus jardins' })).toBeTruthy();
  expect((await container.gerenciarJardins.listar()).find((jardim) => jardim.id === JARDIM_PRINCIPAL.id)?.nome).toBe(
    'Quintal',
  );
  expect(screen.getAllByText('Quintal').length).toBeGreaterThan(0);
});

test('o jardim principal não tem a opção de excluir', async () => {
  renderizarApp({ jardins: [JARDIM_PRINCIPAL, VARANDA] });
  await screen.findByText('Jardim principal');
  abrirSeletor();

  fireEvent.press(screen.getByRole('button', { name: 'Editar o jardim Jardim principal' }));
  expect(screen.queryByRole('button', { name: 'Excluir jardim' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.getByRole('header', { name: 'Seus jardins' })).toBeTruthy();
});

test('excluir um jardim pergunta antes e leva as plantas, as regas e as colheitas dele', async () => {
  const { container, plantas, regas, colheitas } = renderizarApp({
    jardins: [JARDIM_PRINCIPAL, VARANDA],
    plantas: [
      plantaDeTeste({ id: 'p1', apelido: 'Alecrim' }),
      plantaDeTeste({ id: 'p2', apelido: 'Hortelã', idJardim: 'varanda' }),
      plantaDeTeste({ id: 'p3', apelido: 'Manjericão', idJardim: 'varanda' }),
    ],
    regas: [{ id: 'r1', idPlanta: 'p2', regadaEm: new Date(2026, 9, 16, 8) }],
    colheitas: [{ id: 'c1', idPlanta: 'p3', quantidade: 2, unidade: 'unidades', colhidaEm: new Date(2026, 9, 16, 8) }],
  });
  await screen.findByLabelText('Alecrim. Sem dados. Toque para ver os detalhes.');
  abrirSeletor();
  await screen.findByText('2 plantas');

  fireEvent.press(screen.getByRole('button', { name: 'Editar o jardim Varanda' }));
  fireEvent.press(screen.getByRole('button', { name: 'Excluir jardim' }));

  expect(await screen.findByRole('header', { name: 'Excluir Varanda?' })).toBeTruthy();
  expect(
    screen.getByText('O jardim sai junto com as 2 plantas dele, com as regas e as colheitas. Não dá para desfazer.'),
  ).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Excluir' }));

  await waitFor(() => expect(screen.queryByRole('header', { name: 'Excluir Varanda?' })).toBeNull());
  expect((await container.gerenciarJardins.listar()).map((jardim) => jardim.id)).toEqual([JARDIM_PRINCIPAL.id]);
  expect(plantas.salvas.map((planta) => planta.id)).toEqual(['p1']);
  expect(regas.salvas).toEqual([]);
  expect(colheitas.salvas).toEqual([]);
  expect(screen.getByLabelText('Alecrim. Sem dados. Toque para ver os detalhes.')).toBeTruthy();
});

test('excluir o jardim aberto volta para o jardim principal', async () => {
  renderizarApp({
    jardins: [JARDIM_PRINCIPAL, VARANDA],
    plantas: [plantaDeTeste({ id: 'p1', apelido: 'Alecrim' }), plantaDeTeste({ id: 'p2', apelido: 'Hortelã', idJardim: 'varanda' })],
  });
  await screen.findByLabelText('Alecrim. Sem dados. Toque para ver os detalhes.');
  abrirSeletor();
  fireEvent.press(screen.getByRole('button', { name: 'Varanda' }));
  expect(await screen.findByLabelText('Hortelã. Sem dados. Toque para ver os detalhes.')).toBeTruthy();

  abrirSeletor();
  fireEvent.press(screen.getByRole('button', { name: 'Editar o jardim Varanda' }));
  fireEvent.press(screen.getByRole('button', { name: 'Excluir jardim' }));
  expect(await screen.findByText('O jardim sai junto com a planta dele, com as regas e as colheitas. Não dá para desfazer.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Excluir' }));

  expect(await screen.findByLabelText('Alecrim. Sem dados. Toque para ver os detalhes.')).toBeTruthy();
  expect(screen.getAllByText('Jardim principal').length).toBeGreaterThan(0);
});

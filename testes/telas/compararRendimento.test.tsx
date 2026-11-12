import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { RegistroDeColheita } from '@/dominio/modelos/RegistroDeColheita';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

const agora = new Date(2026, 10, 12, 15, 0);
const diasAtras = (dias: number) => new Date(2026, 10, 12 - dias, 10, 0);
let proximoId = 1;
function colheita(
  idPlanta: string,
  quantidade: number,
  colhidaEm: Date,
  unidade: RegistroDeColheita['unidade'] = 'unidades',
): RegistroDeColheita {
  return { id: `c${proximoId++}`, idPlanta, quantidade, unidade, colhidaEm };
}

const plantas = [
  plantaDeTeste({ id: 'p1', apelido: 'Tomatinho' }),
  plantaDeTeste({ id: 'p2', apelido: 'Cereja' }),
  plantaDeTeste({ id: 'p3', apelido: 'Italiano' }),
  plantaDeTeste({ id: 'p4', apelido: 'Jibinha', idEspecie: 'jiboia' }),
];

const marcada = (nome: string) => screen.getByRole('checkbox', { name: nome }).props.accessibilityState.checked;
const resultados = () =>
  screen.getAllByLabelText(/^\dº lugar:/).map((linha) => linha.props.accessibilityLabel as string);

test('o detalhe de uma planta frutífera leva à comparação, já com ela escolhida', async () => {
  renderizarApp({ plantas, url: '/planta/p1', agora });

  fireEvent.press(await screen.findByRole('button', { name: 'Comparar com outras plantas' }));

  await waitFor(() => expect(screen).toHavePathname('/rendimento'));
  expect(await screen.findByRole('header', { name: 'Comparar rendimento' })).toBeTruthy();
  expect(marcada('Tomatinho, Tomate')).toBe(true);
  expect(marcada('Cereja, Tomate')).toBe(false);
  expect(screen.getByText('Escolha mais uma planta para comparar.')).toBeTruthy();
});

test('planta que não dá frutos não tem o atalho para comparar', async () => {
  renderizarApp({ plantas, url: '/planta/p4', agora });
  expect(await screen.findByRole('header', { name: 'Jibinha' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Comparar com outras plantas' })).toBeNull();
});

test('a comparação lista só as plantas que dão frutos', async () => {
  renderizarApp({ plantas, url: '/rendimento', agora });
  expect(await screen.findByRole('checkbox', { name: 'Tomatinho, Tomate' })).toBeTruthy();
  expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  expect(screen.queryByRole('checkbox', { name: /^Jibinha/ })).toBeNull();
});

test('com duas ou mais plantas escolhidas, mostra o rendimento de cada uma, do maior para o menor', async () => {
  renderizarApp({
    plantas,
    url: '/rendimento?planta=p1',
    agora,
    colheitas: [colheita('p1', 4, diasAtras(2)), colheita('p2', 10, diasAtras(5)), colheita('p2', 3, diasAtras(1))],
  });

  fireEvent.press(await screen.findByRole('checkbox', { name: 'Cereja, Tomate' }));
  fireEvent.press(screen.getByRole('checkbox', { name: 'Italiano, Tomate' }));

  await waitFor(() =>
    expect(resultados()).toEqual([
      '1º lugar: Cereja, 13 frutos, em 2 colheitas.',
      '2º lugar: Tomatinho, 4 frutos, em 1 colheita.',
      '3º lugar: Italiano, 0 frutos, nenhuma colheita no período.',
    ]),
  );
});

test('trocar o período recalcula a comparação', async () => {
  renderizarApp({
    plantas,
    url: '/rendimento?planta=p1',
    agora,
    colheitas: [colheita('p1', 5, diasAtras(3)), colheita('p2', 8, diasAtras(10))],
  });
  fireEvent.press(await screen.findByRole('checkbox', { name: 'Cereja, Tomate' }));
  await waitFor(() => expect(resultados()[0]).toBe('1º lugar: Cereja, 8 frutos, em 1 colheita.'));

  fireEvent.press(screen.getByRole('radio', { name: 'Últimos 7 dias' }));

  await waitFor(() =>
    expect(resultados()).toEqual([
      '1º lugar: Tomatinho, 5 frutos, em 1 colheita.',
      '2º lugar: Cereja, 0 frutos, nenhuma colheita no período.',
    ]),
  );
  expect(screen.getByRole('radio', { name: 'Últimos 7 dias' }).props.accessibilityState.checked).toBe(true);
});

test('pesado em gramas compara só as colheitas pesadas', async () => {
  renderizarApp({
    plantas,
    url: '/rendimento?planta=p1',
    agora,
    colheitas: [colheita('p1', 3, diasAtras(1)), colheita('p2', 250.5, diasAtras(1), 'gramas')],
  });
  fireEvent.press(await screen.findByRole('checkbox', { name: 'Cereja, Tomate' }));

  fireEvent.press(screen.getByRole('radio', { name: 'Pesados em gramas' }));

  await waitFor(() =>
    expect(resultados()).toEqual([
      '1º lugar: Cereja, 250,5 g, em 1 colheita.',
      '2º lugar: Tomatinho, 0 g, nenhuma colheita no período.',
    ]),
  );
});

test('desmarcar uma planta volta a pedir mais uma', async () => {
  renderizarApp({ plantas, url: '/rendimento?planta=p1', agora });
  fireEvent.press(await screen.findByRole('checkbox', { name: 'Cereja, Tomate' }));
  await waitFor(() => expect(resultados()).toHaveLength(2));

  fireEvent.press(screen.getByRole('checkbox', { name: 'Cereja, Tomate' }));

  expect(await screen.findByText('Escolha mais uma planta para comparar.')).toBeTruthy();
  expect(screen.queryAllByLabelText(/^\dº lugar:/)).toHaveLength(0);
});

test('com menos de duas plantas frutíferas no jardim, explica o que falta', async () => {
  renderizarApp({
    plantas: [plantaDeTeste({ id: 'p1' }), plantaDeTeste({ id: 'p4', idEspecie: 'jiboia' })],
    url: '/rendimento',
    agora,
  });
  expect(await screen.findByText(/precisa de pelo menos duas plantas que dão frutos/)).toBeTruthy();
  expect(screen.queryByRole('checkbox')).toBeNull();
});

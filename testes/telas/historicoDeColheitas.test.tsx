import { fireEvent, screen, within } from 'expo-router/testing-library';
import { RegistroDeColheita } from '@/dominio/modelos/RegistroDeColheita';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

/** 12/11/2026 às 10:00, no fuso do aparelho. */
const agora = new Date(2026, 10, 12, 10, 0);

const colheita = (id: string, colhidaEm: Date, quantidade: number, unidade: RegistroDeColheita['unidade'] = 'unidades') =>
  ({ id, idPlanta: 'p1', quantidade, unidade, colhidaEm }) satisfies RegistroDeColheita;

function abrir(idEspecie: string, colheitas: RegistroDeColheita[] = []) {
  return renderizarApp({
    plantas: [plantaDeTeste({ id: 'p1', idEspecie, apelido: 'Minha planta' })],
    url: '/planta/p1',
    agora,
    colheitas,
  });
}

test('o histórico lista todas as colheitas, da mais recente para a mais antiga', async () => {
  abrir('tomate', [
    colheita('c1', new Date(2026, 0, 10, 12), 4),
    colheita('c2', new Date(2026, 10, 11, 9), 6),
    colheita('c3', new Date(2026, 9, 1, 12), 250, 'gramas'),
  ]);

  expect(await screen.findByRole('header', { name: 'Colheitas' })).toBeTruthy();
  const itens = await screen.findAllByTestId('item-de-colheita');
  expect(itens.map((item) => item.props.accessibilityLabel)).toEqual([
    'Colheita de 6 frutos em 11/11/2026.',
    'Colheita de 250 g em 01/10/2026.',
    'Colheita de 4 frutos em 10/01/2026.',
  ]);
});

test('o indicador de rendimento aparece junto do histórico, com o total do período por medida', async () => {
  abrir('tomate', [
    colheita('c1', new Date(2026, 10, 11, 9), 6),
    colheita('c2', new Date(2026, 10, 2, 12), 9),
    colheita('c3', new Date(2026, 10, 5, 12), 300.5, 'gramas'),
    colheita('fora', new Date(2026, 5, 1, 12), 100),
  ]);

  const indicador = await screen.findByTestId('indicador-de-rendimento');
  expect(indicador).toHaveTextContent('RENDIMENTO NOS ÚLTIMOS 30 DIAS', { exact: false });
  expect(within(indicador).getByText('15 frutos em 2 colheitas')).toBeTruthy();
  expect(within(indicador).getByText('300,5 g em 1 colheita')).toBeTruthy();
});

test('com colheitas só antigas, o indicador diz que não houve colheita no período', async () => {
  abrir('tomate', [colheita('antiga', new Date(2026, 0, 10, 12), 4)]);

  expect(await screen.findByTestId('indicador-de-rendimento')).toHaveTextContent(
    'Nenhuma colheita nos últimos 30 dias.',
    { exact: false },
  );
  expect(screen.getAllByTestId('item-de-colheita')).toHaveLength(1);
});

test('planta sem colheitas mostra o estado vazio, sem erro', async () => {
  abrir('tomate');

  expect(await screen.findByTestId('colheitas-vazias')).toHaveTextContent('Nenhuma colheita registrada ainda.', {
    exact: false,
  });
  expect(screen.queryByTestId('indicador-de-rendimento')).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
});

test('a seção aparece apenas para plantas frutíferas', async () => {
  abrir('jiboia');

  expect(await screen.findByRole('header', { name: 'Minha planta' })).toBeTruthy();
  expect(screen.queryByRole('header', { name: 'Colheitas' })).toBeNull();
});

test('registrar uma colheita atualiza o histórico e o indicador na hora', async () => {
  abrir('tomate');
  await screen.findByTestId('colheitas-vazias');

  fireEvent.changeText(screen.getByLabelText('Quantidade'), '8');
  fireEvent.press(screen.getByRole('button', { name: 'Registrar colheita' }));

  expect(await screen.findByLabelText('Colheita de 8 frutos em 12/11/2026.')).toBeTruthy();
  expect(within(screen.getByTestId('indicador-de-rendimento')).getByText('8 frutos em 1 colheita')).toBeTruthy();
  expect(screen.queryByTestId('colheitas-vazias')).toBeNull();
});

import { fireEvent, screen } from 'expo-router/testing-library';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

/** 11/11/2026 às 15:30, no fuso do aparelho. */
const agora = new Date(2026, 10, 11, 15, 30);

function abrirTomateiro(opcoes: Parameters<typeof renderizarApp>[0] = {}) {
  return renderizarApp({
    plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'tomate', apelido: 'Tomateiro' })],
    url: '/planta/p1',
    agora,
    ...opcoes,
  });
}

test('planta frutífera mostra o formulário, com a data de hoje já preenchida', async () => {
  abrirTomateiro();

  expect(await screen.findByRole('header', { name: 'Registrar colheita' })).toBeTruthy();
  expect(screen.getByLabelText('Data da colheita')).toHaveProp('value', '11/11/2026');
  expect(screen.getByRole('radio', { name: 'Contei os frutos' })).toHaveProp('accessibilityState', { checked: true });
});

test('planta que não dá frutos não mostra o formulário', async () => {
  renderizarApp({
    plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'jiboia', apelido: 'Jiboia da sala' })],
    url: '/planta/p1',
    agora,
  });

  expect(await screen.findByRole('header', { name: 'Jiboia da sala' })).toBeTruthy();
  expect(screen.queryByRole('header', { name: 'Registrar colheita' })).toBeNull();
});

test('registrar uma colheita válida grava e confirma com uma mensagem simples', async () => {
  const { colheitas } = abrirTomateiro();

  fireEvent.changeText(await screen.findByLabelText('Quantidade'), '12');
  fireEvent.press(screen.getByRole('button', { name: 'Registrar colheita' }));

  expect(await screen.findByText('✓ Colheita registrada: 12 frutos em 11/11/2026.')).toBeTruthy();
  expect(colheitas.salvas).toEqual([
    { id: expect.any(String), idPlanta: 'p1', quantidade: 12, unidade: 'unidades', colhidaEm: agora },
  ]);
  expect(screen.getByLabelText('Quantidade')).toHaveProp('value', '');
});

test('pesando em gramas, aceita vírgula e grava no dia escolhido', async () => {
  const { colheitas } = abrirTomateiro();

  fireEvent.changeText(await screen.findByLabelText('Quantidade'), '250,5');
  fireEvent.press(screen.getByRole('radio', { name: 'Pesei em gramas' }));
  fireEvent.changeText(screen.getByLabelText('Data da colheita'), '05/11/2026');
  fireEvent.press(screen.getByRole('button', { name: 'Registrar colheita' }));

  expect(await screen.findByText('✓ Colheita registrada: 250,5 g em 05/11/2026.')).toBeTruthy();
  expect(colheitas.salvas[0]).toMatchObject({
    quantidade: 250.5,
    unidade: 'gramas',
    colhidaEm: new Date(2026, 10, 5, 12, 0),
  });
});

test.each([
  ['vazia', '', 'Escreva quanto você colheu.'],
  ['zero', '0', 'A quantidade precisa ser um número maior que zero.'],
  ['negativa', '-3', 'A quantidade precisa ser um número maior que zero.'],
])('quantidade %s é recusada com uma mensagem clara, sem gravar', async (_caso, texto, mensagem) => {
  const { colheitas } = abrirTomateiro();

  fireEvent.changeText(await screen.findByLabelText('Quantidade'), texto);
  fireEvent.press(screen.getByRole('button', { name: 'Registrar colheita' }));

  expect(await screen.findByRole('alert')).toHaveTextContent(mensagem);
  expect(colheitas.salvas).toEqual([]);
});

test('data no futuro é recusada com uma mensagem clara', async () => {
  const { colheitas } = abrirTomateiro();

  fireEvent.changeText(await screen.findByLabelText('Quantidade'), '3');
  fireEvent.changeText(screen.getByLabelText('Data da colheita'), '12/11/2026');
  fireEvent.press(screen.getByRole('button', { name: 'Registrar colheita' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('A data da colheita não pode ser depois de hoje.');
  expect(colheitas.salvas).toEqual([]);
});

test('se o armazenamento falhar, avisa e deixa tentar de novo', async () => {
  abrirTomateiro({ falharAoRegistrarColheita: true });

  fireEvent.changeText(await screen.findByLabelText('Quantidade'), '3');
  fireEvent.press(screen.getByRole('button', { name: 'Registrar colheita' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Não deu para registrar a colheita. Tente novamente.');
  expect(screen.getByLabelText('Quantidade')).toHaveProp('value', '3');
});

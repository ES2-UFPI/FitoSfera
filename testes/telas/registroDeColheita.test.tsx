import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
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

describe('a expectativa depois de colher', () => {
  test('sem a data da floração, mostra que está em colheita e pede a data', async () => {
    abrirTomateiro({ colheitas: [{ id: 'c1', idPlanta: 'p1', quantidade: 5, unidade: 'unidades', colhidaEm: new Date(2026, 10, 8, 12) }] });

    fireEvent.changeText(await screen.findByLabelText('Quantidade'), '12');
    fireEvent.press(screen.getByRole('button', { name: 'Registrar colheita' }));

    expect(await screen.findByText('Em colheita')).toBeTruthy();
    expect(screen.getByText('Última colheita em 11/11/2026')).toBeTruthy();
    expect(screen.getByText('Estágio: colheita')).toBeTruthy();
    expect(screen.getByText('Para prever a próxima leva, informe quando começou a floração atual.')).toBeTruthy();
    expect(screen.queryByText('Estimativa indisponível')).toBeNull();
  });

  test('planta já produzindo mostra a última colheita registrada', async () => {
    abrirTomateiro({
      plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'tomate', apelido: 'Tomateiro', colheitaIniciada: true, floracaoIniciadaEm: null })],
      colheitas: [{ id: 'c1', idPlanta: 'p1', quantidade: 5, unidade: 'unidades', colhidaEm: new Date(2026, 10, 8, 12) }],
    });

    expect(await screen.findByText('Última colheita em 08/11/2026')).toBeTruthy();
    expect(screen.getByText('Em colheita')).toBeTruthy();
  });

  test('o botão leva para a edição, onde fica a data da floração', async () => {
    abrirTomateiro({
      plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'tomate', apelido: 'Tomateiro', colheitaIniciada: true, floracaoIniciadaEm: null })],
    });

    fireEvent.press(await screen.findByRole('button', { name: 'Informar início da floração' }));

    expect(await screen.findByText(/floração/i, { exact: false })).toBeTruthy();
    expect(screen).toHavePathname('/editar/p1/apelido');
  });
});

test('na edição, a resposta sobre a produção já vem marcada com o que a planta tem', async () => {
  renderizarApp({
    plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'tomate', apelido: 'Tomateiro', colheitaIniciada: false })],
    url: '/editar/p1/apelido',
    agora,
  });

  const nao = await screen.findByRole('radio', { name: 'Não, ainda não está produzindo' });
  expect(nao.props.accessibilityState.checked).toBe(true);
  expect(screen.getByRole('button', { name: 'Salvar alterações' }).props.accessibilityState.disabled).toBe(false);
});

test('colheita com data antes do plantio é recusada com uma mensagem clara', async () => {
  const { colheitas } = abrirTomateiro({
    plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'tomate', apelido: 'Tomateiro', plantadaEm: new Date(2026, 10, 1) })],
  });

  fireEvent.changeText(await screen.findByLabelText('Quantidade'), '6');
  fireEvent.changeText(screen.getByLabelText('Data da colheita'), '05/10/2026');
  fireEvent.press(screen.getByRole('button', { name: 'Registrar colheita' }));

  expect(await screen.findByText('A colheita não pode ser antes do plantio (01/11/2026).')).toBeTruthy();
  expect(colheitas.salvas).toEqual([]);
});

test('excluir uma frutífera avisa que as colheitas também saem', async () => {
  abrirTomateiro();
  fireEvent.press(await screen.findByRole('button', { name: 'Excluir' }));
  expect(
    await screen.findByText('A planta sai da estante junto com o histórico de regas e de colheitas. Não dá para desfazer.'),
  ).toBeTruthy();
});

describe('voltando da edição', () => {
  test('mostra "Alterações salvas" no topo e some com a confirmação antiga da colheita', async () => {
    abrirTomateiro();
    fireEvent.changeText(await screen.findByLabelText('Quantidade'), '12');
    fireEvent.press(screen.getByRole('button', { name: 'Registrar colheita' }));
    expect(await screen.findByText('✓ Colheita registrada: 12 frutos em 11/11/2026.')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Continuar' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('✓ Alterações salvas')).toBeTruthy();
    expect(screen).toHavePathname('/planta/p1');
    expect(screen.queryByText('✓ Colheita registrada: 12 frutos em 11/11/2026.')).toBeNull();
  });

  test('abrir a planta sem ter editado não mostra a faixa', async () => {
    abrirTomateiro();
    expect(await screen.findByRole('header', { name: 'Tomateiro' })).toBeTruthy();
    expect(screen.queryByText('✓ Alterações salvas')).toBeNull();
  });
});

describe('apagar uma colheita', () => {
  const colhida = (id: string, dia: number, quantidade: number) =>
    ({ id, idPlanta: 'p1', quantidade, unidade: 'unidades' as const, colhidaEm: new Date(2026, 10, dia, 9, 0) });

  test('pede confirmação e, confirmando, tira a colheita da lista e do armazenamento', async () => {
    const { colheitas } = abrirTomateiro({ colheitas: [colhida('c1', 8, 5), colhida('c2', 10, 7)] });

    fireEvent.press(await screen.findByRole('button', { name: 'Apagar a colheita de 7 frutos em 10/11/2026' }));
    expect(screen.getByRole('header', { name: 'Apagar a colheita de 7 frutos em 10/11/2026?' })).toBeTruthy();
    expect(screen.getByText('Ela sai do histórico e da conta do rendimento. Não dá para desfazer.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Apagar colheita' }));

    await waitFor(() => expect(screen.queryByLabelText('Colheita de 7 frutos em 10/11/2026.')).toBeNull());
    expect(screen.getByLabelText('Colheita de 5 frutos em 08/11/2026.')).toBeTruthy();
    expect(colheitas.salvas.map((c) => c.id)).toEqual(['c1']);
  });
});

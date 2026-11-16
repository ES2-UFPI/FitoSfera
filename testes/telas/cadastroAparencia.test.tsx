import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { renderizarApp } from './apoio/renderizarApp';

async function irAtePasso2(especie: string) {
  const resultado = renderizarApp({ url: '/cadastro' });
  fireEvent.press(await screen.findByRole('button', { name: especie }));
  await screen.findByText('Como vai ser a sua planta?');
  return resultado;
}

async function irAtePasso3(especie: string) {
  const resultado = await irAtePasso2(especie);
  fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  await screen.findByText('Como você vai chamar esta planta?');
  return resultado;
}

const responderProducao = (resposta: 'Sim' | 'Não') =>
  fireEvent.press(
    screen.getByRole('radio', {
      name: resposta === 'Sim' ? 'Sim, já está produzindo' : 'Não, ainda não está produzindo',
    }),
  );
const marcado = (rotulo: string) => screen.getByRole('radio', { name: rotulo }).props.accessibilityState.checked;

const selecionado = (rotulo: string) => screen.getByRole('button', { name: rotulo }).props.accessibilityState.selected;
const desabilitado = (rotulo: string) => screen.getByRole('button', { name: rotulo }).props.accessibilityState.disabled;

test('uma planta que dá frutos já começa com a forma Frutífera e os frutos à mostra', async () => {
  await irAtePasso2('Tomate');
  expect(selecionado('Forma: Frutífera')).toBe(true);
  expect(screen.getByText('FRUTOS')).toBeTruthy();
});

test('o passo 2 começa na aparência inicial e esconde o destaque para Erva', async () => {
  await irAtePasso2('Lavanda');
  expect(selecionado('Forma: Erva')).toBe(true);
  expect(selecionado('Folhagem: Verde-folha')).toBe(true);
  expect(selecionado('Vaso: Terracota')).toBe(true);
  expect(screen.queryByText('FRUTOS')).toBeNull();
});

test('escolher Frutífera mostra a seção FRUTOS com o vermelho marcado', async () => {
  await irAtePasso2('Tomate');
  fireEvent.press(screen.getByRole('button', { name: 'Forma: Frutífera' }));
  expect(await screen.findByText('FRUTOS')).toBeTruthy();
  expect(selecionado('Frutos: Vermelho')).toBe(true);
});

test('fluxo completo salva a aparência escolhida e volta ao jardim com a planta na estante', async () => {
  const { plantas } = await irAtePasso2('Tomate');
  fireEvent.press(screen.getByRole('button', { name: 'Forma: Frutífera' }));
  fireEvent.press(screen.getByRole('button', { name: 'Folhagem: Roxo' }));
  fireEvent.press(await screen.findByRole('button', { name: 'Frutos: Amarelo' }));
  fireEvent.press(screen.getByRole('button', { name: 'Vaso: Azul' }));
  fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

  fireEvent.changeText(await screen.findByLabelText('Apelido da planta'), 'Tomatinho');
  responderProducao('Não');
  fireEvent.press(screen.getByRole('button', { name: 'Colocar na estante' }));

  await waitFor(() => expect(plantas.salvas).toHaveLength(1));
  expect(plantas.salvas[0]).toMatchObject({
    idEspecie: 'tomate',
    apelido: 'Tomatinho',
    aparencia: { forma: 'frutifera', folhagem: 'roxo', destaque: 'amarelo', vaso: 'azul' },
  });
  expect(plantas.salvas[0].plantadaEm).toEqual(new Date(2026, 9, 17, 14, 0));
  expect(
    await screen.findByLabelText('Tomatinho. Sem dados. Toque para ver os detalhes.',{},{timeout: 3000}),
  ).toBeTruthy();
  expect(screen).toHavePathname('/');
});

test('o apelido começa com o nome comum da espécie', async () => {
  await irAtePasso3('Lavanda');
  expect(screen.getByLabelText('Apelido da planta').props.value).toBe('Lavanda');
});

test('apelido vazio ou com 31 caracteres desabilita o botão; com 30 habilita', async () => {
  await irAtePasso3('Tomate');
  responderProducao('Não');
  const campo = screen.getByLabelText('Apelido da planta');
  fireEvent.changeText(campo, '   ');
  expect(desabilitado('Colocar na estante')).toBe(true);
  fireEvent.changeText(campo, 'a'.repeat(31));
  expect(desabilitado('Colocar na estante')).toBe(true);
  fireEvent.changeText(campo, 'a'.repeat(30));
  expect(desabilitado('Colocar na estante')).toBe(false);
});

test('toque duplo em "Colocar na estante" salva uma planta só', async () => {
  const { plantas } = await irAtePasso3('Tomate');
  responderProducao('Não');
  const botao = screen.getByRole('button', { name: 'Colocar na estante' });
  fireEvent.press(botao);
  fireEvent.press(botao);
  await screen.findByLabelText('Tomate. Sem dados. Toque para ver os detalhes.',{},{timeout: 3000});
  expect(plantas.salvas).toHaveLength(1);
});

test('uma frutífera pode informar uma data anterior de plantio', async () => {
  const { plantas } = await irAtePasso3('Tomate');
  fireEvent.press(screen.getByRole('radio', { name: 'Informar data aproximada do plantio' }));
  fireEvent.changeText(screen.getByLabelText('Data aproximada do plantio'), '12/10/2026');
  responderProducao('Não');
  fireEvent.press(screen.getByRole('button', { name: 'Colocar na estante' }));

  await waitFor(() => expect(plantas.salvas).toHaveLength(1));
  expect(plantas.salvas[0].plantadaEm).toEqual(new Date(2026, 9, 12));
});

test('não permite data de plantio inválida ou futura', async () => {
  await irAtePasso3('Tomate');
  fireEvent.press(screen.getByRole('radio', { name: 'Informar data aproximada do plantio' }));
  fireEvent.changeText(screen.getByLabelText('Data aproximada do plantio'), '18/10/2026');

  expect(screen.getByText('Informe uma data válida, que não seja no futuro.')).toBeTruthy();
  expect(desabilitado('Colocar na estante')).toBe(true);
});

describe('a pergunta "Esta planta já está produzindo?"', () => {
  test('é uma pergunta à parte, sem resposta marcada, e o botão espera a resposta', async () => {
    await irAtePasso3('Tomate');
    expect(screen.getByText('Esta planta já está produzindo?')).toBeTruthy();
    expect(marcado('Sim, já está produzindo')).toBe(false);
    expect(marcado('Não, ainda não está produzindo')).toBe(false);
    expect(desabilitado('Colocar na estante')).toBe(true);
    expect(screen.getByText('Responda se a planta já está produzindo para continuar.')).toBeTruthy();

    responderProducao('Não');
    expect(desabilitado('Colocar na estante')).toBe(false);
    expect(screen.queryByText('Responda se a planta já está produzindo para continuar.')).toBeNull();
  });

  test('Sim e Não se excluem, e não mexem na resposta sobre o plantio', async () => {
    await irAtePasso3('Tomate');
    responderProducao('Sim');
    expect(marcado('Vou começar com uma muda hoje')).toBe(true);
    expect(marcado('Sim, já está produzindo')).toBe(true);

    responderProducao('Não');
    expect(marcado('Sim, já está produzindo')).toBe(false);
    expect(marcado('Não, ainda não está produzindo')).toBe(true);
    expect(marcado('Vou começar com uma muda hoje')).toBe(true);
    expect(screen.queryByLabelText('Quando começou a floração atual?')).toBeNull();
  });

  test('Não grava a planta como ainda não produzindo', async () => {
    const { plantas } = await irAtePasso3('Tomate');
    responderProducao('Não');
    fireEvent.press(screen.getByRole('button', { name: 'Colocar na estante' }));
    await waitFor(() => expect(plantas.salvas).toHaveLength(1));
    expect(plantas.salvas[0]).toMatchObject({ colheitaIniciada: false, floracaoIniciadaEm: null });
  });

  test('planta que não dá frutos não vê a pergunta', async () => {
    await irAtePasso3('Lavanda');
    expect(screen.queryByText('Esta planta já está produzindo?')).toBeNull();
    expect(desabilitado('Colocar na estante')).toBe(false);
  });
});

test('permite marcar produção iniciada e registrar o começo aproximado da floração', async () => {
  const { plantas } = await irAtePasso3('Tomate');
  fireEvent.press(screen.getByRole('radio', { name: 'Não sei quando foi plantada' }));
  responderProducao('Sim');
  fireEvent.changeText(screen.getByLabelText('Quando começou a floração atual?'), '10/10/2026');
  fireEvent.press(screen.getByRole('button', { name: 'Colocar na estante' }));

  await waitFor(() => expect(plantas.salvas).toHaveLength(1));
  expect(plantas.salvas[0]).toMatchObject({
    colheitaIniciada: true,
    floracaoIniciadaEm: new Date(2026, 9, 10),
  });
});

test('abrir o passo 2 sem espécie escolhida volta para a busca', async () => {
  renderizarApp({ url: '/cadastro/aparencia' });
  expect(await screen.findByPlaceholderText('Nome da planta')).toBeTruthy();
  await screen.findAllByTestId('resultado-especie');
});

test('floração antes do plantio é recusada com uma mensagem clara', async () => {
  await irAtePasso3('Tomate');
  fireEvent.press(screen.getByRole('radio', { name: 'Informar data aproximada do plantio' }));
  fireEvent.changeText(screen.getByLabelText('Data aproximada do plantio'), '01/09/2026');
  responderProducao('Sim');
  fireEvent.changeText(screen.getByLabelText('Quando começou a floração atual?'), '01/08/2026');

  expect(screen.getByText('A floração não pode ter começado antes do plantio.')).toBeTruthy();
  expect(desabilitado('Colocar na estante')).toBe(true);

  fireEvent.changeText(screen.getByLabelText('Quando começou a floração atual?'), '01/10/2026');
  expect(screen.queryByText('A floração não pode ter começado antes do plantio.')).toBeNull();
  expect(desabilitado('Colocar na estante')).toBe(false);
});

test('no cadastro, a ajuda da floração não fala de histórico', async () => {
  await irAtePasso3('Tomate');
  responderProducao('Sim');
  expect(screen.getByText('A previsão da próxima colheita usa esta data.')).toBeTruthy();
});

test('a dica e o contador do apelido ficam logo abaixo do campo, antes das perguntas da frutífera', async () => {
  await irAtePasso3('Tomate');
  const ordem = screen
    .getAllByText(/Esse nome aparece na etiqueta|Quando esta muda foi plantada/)
    .map((texto) => texto.props.children);
  expect(ordem).toEqual(['Esse nome aparece na etiqueta da estante', 'Quando esta muda foi plantada?']);
});

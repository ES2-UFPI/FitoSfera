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

const selecionado = (rotulo: string) => screen.getByRole('button', { name: rotulo }).props.accessibilityState.selected;
const desabilitado = (rotulo: string) => screen.getByRole('button', { name: rotulo }).props.accessibilityState.disabled;

test('o passo 2 começa na aparência inicial e esconde o destaque para Erva', async () => {
  await irAtePasso2('Tomate');
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
  fireEvent.press(screen.getByRole('button', { name: 'Colocar na estante' }));

  await waitFor(() => expect(plantas.salvas).toHaveLength(1));
  expect(plantas.salvas[0]).toMatchObject({
    idEspecie: 'tomate',
    apelido: 'Tomatinho',
    aparencia: { forma: 'frutifera', folhagem: 'roxo', destaque: 'amarelo', vaso: 'azul' },
  });
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
  const botao = screen.getByRole('button', { name: 'Colocar na estante' });
  fireEvent.press(botao);
  fireEvent.press(botao);
  await screen.findByLabelText('Tomate. Sem dados. Toque para ver os detalhes.',{},{timeout: 3000});
  expect(plantas.salvas).toHaveLength(1);
});

test('abrir o passo 2 sem espécie escolhida volta para a busca', async () => {
  renderizarApp({ url: '/cadastro/aparencia' });
  expect(await screen.findByPlaceholderText('Nome da planta')).toBeTruthy();
  await screen.findAllByTestId('resultado-especie');
});

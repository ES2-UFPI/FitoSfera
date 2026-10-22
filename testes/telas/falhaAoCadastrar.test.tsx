import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { renderizarApp } from './apoio/renderizarApp';

async function irAtePasso3(opcoes: { falhaAoCadastrar?: boolean } = {}) {
  const resultado = renderizarApp({ ...opcoes, url: '/cadastro' });
  fireEvent.press(await screen.findByRole('button', { name: 'Tomate' }));
  await screen.findByText('Como vai ser a sua planta?');
  fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  await screen.findByText('Como você vai chamar esta planta?');
  return resultado;
}

test('o cadastro confirma com o nome da planta antes de voltar ao jardim', async () => {
  await irAtePasso3();
  fireEvent.changeText(screen.getByLabelText('Apelido da planta'), '  Tomatinho  ');
  fireEvent.press(screen.getByRole('button', { name: 'Colocar na estante' }));

  expect(await screen.findByText('Tomatinho entrou para a estante!')).toBeTruthy();
  expect(screen).toHavePathname('/cadastro/apelido');

  await waitFor(() => expect(screen).toHavePathname('/'), { timeout: 3000 });
  expect(await screen.findByLabelText('Tomatinho. Sem dados. Toque para ver os detalhes.')).toBeTruthy();
});

test('falha na gravação mostra o erro e não volta ao jardim', async () => {
  const { plantas } = await irAtePasso3({ falhaAoCadastrar: true });
  fireEvent.changeText(screen.getByLabelText('Apelido da planta'), 'Tomatinho');
  fireEvent.press(screen.getByRole('button', { name: 'Colocar na estante' }));

  expect(await screen.findByText('Ocorreu um erro ao salvar. Tente novamente.')).toBeTruthy();
  expect(plantas.salvas).toHaveLength(0);
  expect(screen).toHavePathname('/cadastro/apelido');
  expect(screen.getByRole('button', { name: 'Colocar na estante' }).props.accessibilityState.disabled).toBe(false);
});

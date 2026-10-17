import { act, fireEvent, screen, waitFor, within } from 'expo-router/testing-library';
import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';
import { ATRASO_DA_BUSCA_MS } from '@/apresentacao/telas/cadastro/TelaBuscarEspecie';
import { renderizarApp } from './apoio/renderizarApp';

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function nomesListados() {
  const resultados = await screen.findAllByTestId('resultado-especie');
  return resultados.map((resultado) => within(resultado).getByTestId('nome-comum').props.children);
}

test('com a busca vazia lista o catálogo em ordem alfabética', async () => {
  renderizarApp({ url: '/cadastro' });
  expect(await nomesListados()).toEqual(['Alface', 'Espada-de-são-jorge', 'Jiboia', 'Lavanda', 'Tomate']);
});

test('"sao jorge" encontra a Espada-de-são-jorge', async () => {
  renderizarApp({ url: '/cadastro' });
  fireEvent.changeText(await screen.findByPlaceholderText('Nome da planta'), 'sao jorge');
  await waitFor(() => {
    const resultados = screen.getAllByTestId('resultado-especie');
    const nomes = resultados.map((resultado) => within(resultado).getByTestId('nome-comum').props.children);
    expect(nomes).toEqual(['Espada-de-são-jorge']);
  });
});

test('sem resultado mostra a mensagem do catálogo', async () => {
  renderizarApp({ url: '/cadastro' });
  fireEvent.changeText(await screen.findByPlaceholderText('Nome da planta'), 'xyzw');
  expect(await screen.findByText('Não encontramos essa planta no catálogo.')).toBeTruthy();
});

test('digitação rápida espera o debounce e pesquisa somente o último termo', async () => {
  const executar = jest.spyOn(PesquisarEspecies.prototype, 'executar');
  renderizarApp({ url: '/cadastro' });
  await screen.findAllByTestId('resultado-especie');
  executar.mockClear();
  jest.useFakeTimers();

  const campo = screen.getByPlaceholderText('Nome da planta');
  fireEvent.changeText(campo, 't');
  fireEvent.changeText(campo, 'to');
  fireEvent.changeText(campo, 'tom');

  act(() => jest.advanceTimersByTime(ATRASO_DA_BUSCA_MS - 1));
  expect(executar).not.toHaveBeenCalled();

  await act(async () => jest.advanceTimersByTime(1));
  expect(executar).toHaveBeenCalledTimes(1);
  expect(executar).toHaveBeenCalledWith('tom');

});

test('tocar numa espécie avança para o passo 2', async () => {
  renderizarApp({ url: '/cadastro' });
  fireEvent.press(await screen.findByRole('button', { name: 'Tomate' }));
  expect(screen).toHavePathname('/cadastro/aparencia');
});

test('o cabeçalho do cadastro marca o passo 1 de 3', async () => {
  renderizarApp({ url: '/cadastro' });
  expect(await screen.findByLabelText('Passo 1 de 3')).toBeTruthy();
  await screen.findAllByTestId('resultado-especie');
});

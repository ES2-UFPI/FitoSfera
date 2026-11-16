import { RefreshControl } from 'react-native';
import { act, fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

test('puxar a estante atualiza a leitura do jardim selecionado e mostra o carregamento', async () => {
  const { container } = renderizarApp({ plantas: [plantaDeTeste({ apelido: 'Tomatinho' })] });
  await screen.findByText('Tomatinho');
  let concluir: (() => void) | undefined;
  const atualizar = jest.spyOn(container.atualizarLeituras, 'executar').mockImplementation(
    () => new Promise((resolver) => { concluir = () => resolver({ houveFalha: false }); }),
  );

  fireEvent(screen.UNSAFE_getByType(RefreshControl), 'refresh');

  await waitFor(() => expect(atualizar).toHaveBeenCalledWith('jardim-principal'));
  expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(true);
  concluir?.();
  await waitFor(() => expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false));
});

test('falha na atualização mantém as plantas e mostra um aviso temporário sobre a estante', async () => {
  const { container } = renderizarApp({ plantas: [plantaDeTeste({ apelido: 'Tomatinho' })] });
  await screen.findByText('Tomatinho');
  jest.spyOn(container.atualizarLeituras, 'executar').mockResolvedValue({ houveFalha: true });
  const temporizador = jest.spyOn(global, 'setTimeout');

  fireEvent(screen.UNSAFE_getByType(RefreshControl), 'refresh');

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Não foi possível atualizar as leituras. Os últimos dados continuam disponíveis.',
  );
  expect(screen.getByText('Tomatinho')).toBeTruthy();
  expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(false);
  expect(screen.getByTestId('aviso-de-atualizacao').props.style).toEqual(expect.objectContaining({ position: 'absolute' }));

  const [fechar] = temporizador.mock.calls.find(([, duracao]) => duracao === 4_000) ?? [];
  act(() => (fechar as (() => void))());
  expect(screen.queryByRole('alert')).toBeNull();
  temporizador.mockRestore();
});

import { act, render, screen } from '@testing-library/react-native';
import { AberturaAnimada, DURACAO_DA_ABERTURA_MS } from '@/apresentacao/abertura/AberturaAnimada';
import { CamadaDaAbertura } from '@/apresentacao/abertura/CamadaDaAbertura';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('mostra só a palavra FitoSfera e chama aoTerminar ao fim da animação', () => {
  const aoTerminar = jest.fn();
  render(<AberturaAnimada aoTerminar={aoTerminar} />);
  expect(screen.getByText('FitoSfera')).toBeTruthy();
  expect(screen.queryByText(/bem cuidado/)).toBeNull();

  act(() => jest.advanceTimersByTime(DURACAO_DA_ABERTURA_MS - 1));
  expect(aoTerminar).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(1));
  expect(aoTerminar).toHaveBeenCalledTimes(1);
});

test('a camada da abertura espera o jardim carregar, mesmo depois da animação', () => {
  const { rerender } = render(<CamadaDaAbertura jardimCarregado={false} />);
  act(() => jest.advanceTimersByTime(DURACAO_DA_ABERTURA_MS + 1000));
  expect(screen.getByTestId('abertura')).toBeTruthy();

  rerender(<CamadaDaAbertura jardimCarregado />);
  act(() => jest.advanceTimersByTime(1000));
  expect(screen.queryByTestId('abertura')).toBeNull();
});

test('com o jardim já carregado, a camada some só quando a animação acaba', () => {
  render(<CamadaDaAbertura jardimCarregado />);
  act(() => jest.advanceTimersByTime(DURACAO_DA_ABERTURA_MS - 100));
  expect(screen.getByTestId('abertura')).toBeTruthy();
  // Passa do fim da animação; o React aplica o efeito ao fechar o act, e só então o sumiço começa.
  act(() => jest.advanceTimersByTime(100));
  act(() => jest.advanceTimersByTime(1000));
  expect(screen.queryByTestId('abertura')).toBeNull();
});

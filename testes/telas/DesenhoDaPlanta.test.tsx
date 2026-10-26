import { render, screen } from '@testing-library/react-native';
import { DesenhoDaPlanta } from '@/apresentacao/ilustracao/DesenhoDaPlanta';
import { APARENCIA_INICIAL, FORMAS } from '@/dominio/modelos/Aparencia';

test.each(FORMAS)('desenha a forma %s', (forma) => {
  render(<DesenhoDaPlanta aparencia={{ ...APARENCIA_INICIAL, forma }} largura={80} />);
  expect(screen.getByTestId(`desenho-${forma}`)).toBeTruthy();
});

test('só a pendente tem ramos caindo por cima do vaso', () => {
  const { unmount } = render(<DesenhoDaPlanta aparencia={{ ...APARENCIA_INICIAL, forma: 'pendente' }} largura={80} />);
  expect(screen.getByTestId('ramos-pendentes')).toBeTruthy();
  unmount();
  render(<DesenhoDaPlanta aparencia={{ ...APARENCIA_INICIAL, forma: 'erva' }} largura={80} />);
  expect(screen.queryByTestId('ramos-pendentes')).toBeNull();
});

test('a altura do desenho é 1,7 vez a largura', () => {
  render(<DesenhoDaPlanta aparencia={APARENCIA_INICIAL} largura={100} />);
  expect(screen.getByTestId('desenho-erva')).toHaveStyle({ width: 100, height: 170 });
});

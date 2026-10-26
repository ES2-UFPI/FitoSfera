import { fireEvent, screen } from 'expo-router/testing-library';
import { ALTURA_DA_PRATELEIRA, FOLGA_DO_BOTAO_FLUTUANTE } from '@/apresentacao/tema/medidas';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

const variasPlantas = (quantidade: number) =>
  Array.from({ length: quantidade }, (_, i) => plantaDeTeste({ id: `p${i + 1}`, apelido: `Planta ${i + 1}` }));

async function definirAltura(altura: number) {
  fireEvent(await screen.findByTestId('area-da-estante'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 360, height: altura } },
  });
}

const alturaPara3Prateleiras = 3 * ALTURA_DA_PRATELEIRA + FOLGA_DO_BOTAO_FLUTUANTE;

test('mostra as plantas na ordem de cadastro', async () => {
  renderizarApp({
    plantas: [plantaDeTeste({ id: 'p1', apelido: 'Tomatinho' }), plantaDeTeste({ id: 'p2', apelido: 'Jiboinha' })],
  });
  const vasos = await screen.findAllByLabelText(/Toque para ver os detalhes/);
  expect(vasos.map((vaso) => vaso.props.accessibilityLabel)).toEqual([
    'Tomatinho. Sem dados. Toque para ver os detalhes.',
    'Jiboinha. Sem dados. Toque para ver os detalhes.',
  ]);
});

test('a etiqueta mostra o apelido da planta', async () => {
  renderizarApp({ plantas: [plantaDeTeste({ id: 'p1', apelido: 'Tomatinho' })] });
  expect(await screen.findByText('Tomatinho')).toBeTruthy();
});

test('mostra o vaso fantasma e o botão Nova planta', async () => {
  renderizarApp({ plantas: [plantaDeTeste()] });
  expect(await screen.findByLabelText('Cadastrar uma nova planta')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Nova planta' })).toBeTruthy();
});

test('com 8 plantas e 3 prateleiras na tela a estante não rola', async () => {
  renderizarApp({ plantas: variasPlantas(8) });
  await definirAltura(alturaPara3Prateleiras);
  expect(screen.getByTestId('estante').props.scrollEnabled).toBe(false);
});

test('com 9 plantas e 3 prateleiras na tela a estante rola', async () => {
  renderizarApp({ plantas: variasPlantas(9) });
  await definirAltura(alturaPara3Prateleiras);
  expect(screen.getByTestId('estante').props.scrollEnabled).toBe(true);
});

test('o vaso fantasma leva ao cadastro', async () => {
  renderizarApp({ plantas: [plantaDeTeste()] });
  fireEvent.press(await screen.findByLabelText('Cadastrar uma nova planta'));
  expect(screen).toHavePathname('/cadastro');
  await screen.findAllByTestId('resultado-especie');
});

test('o botão Nova planta leva ao cadastro', async () => {
  renderizarApp({ plantas: [plantaDeTeste()] });
  fireEvent.press(await screen.findByRole('button', { name: 'Nova planta' }));
  expect(screen).toHavePathname('/cadastro');
  await screen.findAllByTestId('resultado-especie');
});

describe('status resumido na estante', () => {
  const agora = new Date(2026, 9, 17, 14, 0);
  const leitura = (luminosidadeLux: number) => ({
    umidadePercentual: 60,
    temperaturaCelsius: 24,
    luminosidadeLux,
    medidaEm: new Date(agora.getTime() - 5 * 60_000),
  });

  test('sem sensor, cada vaso mostra "sem dados" (nunca "ok")', async () => {
    renderizarApp({ plantas: [plantaDeTeste({ id: 'p1' }), plantaDeTeste({ id: 'p2', apelido: 'Outra' })] });
    expect(await screen.findAllByText('sem dados')).toHaveLength(2);
    expect(screen.queryByText('ok')).toBeNull();
    expect(screen.getByLabelText('Tomatinho. Sem dados. Toque para ver os detalhes.')).toBeTruthy();
  });

  test('leitura recente dentro da faixa mostra "ok"', async () => {
    renderizarApp({ plantas: [plantaDeTeste()], leitura: leitura(12000), agora });
    expect(await screen.findByText('ok')).toBeTruthy();
    expect(screen.getByLabelText('Tomatinho. Ok. Toque para ver os detalhes.')).toBeTruthy();
  });

  test('leitura fora da faixa mostra "atenção"', async () => {
    renderizarApp({ plantas: [plantaDeTeste()], leitura: leitura(800), agora });
    expect(await screen.findByText('atenção')).toBeTruthy();
    expect(screen.getByLabelText('Tomatinho. Precisa de atenção. Toque para ver os detalhes.')).toBeTruthy();
  });
});

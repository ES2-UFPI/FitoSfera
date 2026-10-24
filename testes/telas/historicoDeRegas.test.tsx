import { fireEvent, screen } from 'expo-router/testing-library';
import { LIMITE_DO_HISTORICO_DE_REGAS } from '@/aplicacao/casos-de-uso/ListarRegasDaPlanta';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

const agora = new Date(2026, 9, 20, 9, 0);
const rega = (id: string, regadaEm: Date, idPlanta = 'p1') => ({ id, idPlanta, regadaEm });

test('o detalhe abre o histórico da planta pelo atalho do cartão de rega', async () => {
  renderizarApp({
    plantas: [plantaDeTeste({ apelido: 'Tomatinho' })],
    regas: [rega('r1', new Date(2026, 9, 19, 18, 30))],
    url: '/planta/p1',
    agora,
  });

  fireEvent.press(await screen.findByRole('button', { name: 'Ver todas as regas' }));

  expect(screen).toHavePathname('/historico/p1');
  expect(await screen.findByRole('header', { name: 'Histórico de regas' })).toBeTruthy();
  expect(screen.getByText('Tomatinho')).toBeTruthy();
});

test('lista as regas da mais recente para a mais antiga, com o quando de cada uma', async () => {
  renderizarApp({
    plantas: [plantaDeTeste()],
    regas: [
      rega('r1', new Date(2026, 9, 15, 7, 15)),
      rega('r3', new Date(2026, 9, 20, 8, 5)),
      rega('r2', new Date(2026, 9, 19, 18, 30)),
    ],
    url: '/historico/p1',
    agora,
  });

  expect(await screen.findByText('3 REGAS REGISTRADAS')).toBeTruthy();
  expect(screen.getByLabelText('20/10/2026 às 08:05, hoje.')).toBeTruthy();
  expect(screen.getByLabelText('19/10/2026 às 18:30, ontem.')).toBeTruthy();
  expect(screen.getByLabelText('15/10/2026 às 07:15, há 5 dias.')).toBeTruthy();

  const mostradas = screen.getAllByLabelText(/às \d\d:\d\d,/).map((item) => item.props.accessibilityLabel);
  expect(mostradas).toEqual([
    '20/10/2026 às 08:05, hoje.',
    '19/10/2026 às 18:30, ontem.',
    '15/10/2026 às 07:15, há 5 dias.',
  ]);
});

test(`com mais regas que o limite, mostra só as ${LIMITE_DO_HISTORICO_DE_REGAS} mais recentes e diz isso`, async () => {
  const regas = Array.from({ length: 23 }, (_, dia) => rega(`r${dia + 1}`, new Date(2026, 8, dia + 1, 8, 0)));
  renderizarApp({ plantas: [plantaDeTeste()], regas, url: '/historico/p1', agora });

  expect(await screen.findByText(`AS ${LIMITE_DO_HISTORICO_DE_REGAS} REGAS MAIS RECENTES`)).toBeTruthy();
  expect(screen.getAllByLabelText(/às \d\d:\d\d,/)).toHaveLength(LIMITE_DO_HISTORICO_DE_REGAS);
  expect(screen.getByLabelText(/^23\/09\/2026 às 08:00,/)).toBeTruthy();
  expect(screen.getByLabelText(/^04\/09\/2026 às 08:00,/)).toBeTruthy();
  expect(screen.queryByLabelText(/^03\/09\/2026/)).toBeNull();
});

test('uma única rega vem no singular', async () => {
  renderizarApp({
    plantas: [plantaDeTeste()],
    regas: [rega('r1', new Date(2026, 9, 19, 18, 30))],
    url: '/historico/p1',
    agora,
  });

  expect(await screen.findByText('1 REGA REGISTRADA')).toBeTruthy();
});

test('planta sem rega registrada mostra o estado vazio, sem lista', async () => {
  renderizarApp({ plantas: [plantaDeTeste()], url: '/historico/p1', agora });

  expect(await screen.findByRole('header', { name: 'Nenhuma rega registrada' })).toBeTruthy();
  expect(
    screen.getByText('Toque em “Registrar rega” no detalhe da planta e cada rega passa a aparecer aqui.'),
  ).toBeTruthy();
  expect(screen.queryByText(/REGAS REGISTRADAS/)).toBeNull();
  expect(screen.queryByLabelText(/às \d\d:\d\d,/)).toBeNull();
});

test('uma rega registrada no detalhe já aparece ao abrir o histórico', async () => {
  renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora });

  fireEvent.press(await screen.findByRole('button', { name: 'Registrar rega' }));
  expect(await screen.findByText('✓ Rega registrada agora.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Ver todas as regas' }));

  expect(await screen.findByLabelText('20/10/2026 às 09:00, hoje.')).toBeTruthy();
  expect(screen.getByText('1 REGA REGISTRADA')).toBeTruthy();
});

test('id inexistente mostra "Planta não encontrada"', async () => {
  renderizarApp({ url: '/historico/p9', agora });

  expect(await screen.findByText('Planta não encontrada')).toBeTruthy();
});

test('falha ao ler o armazenamento mostra o aviso de erro', async () => {
  const aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  renderizarApp({ plantas: [plantaDeTeste()], url: '/historico/p1', agora, falharAoLer: true });

  expect(await screen.findByRole('alert')).toHaveTextContent('Não deu para ler o histórico agora.');
  aviso.mockRestore();
});

test('"Voltar" no histórico aberto direto pelo link leva ao jardim', async () => {
  renderizarApp({ plantas: [plantaDeTeste({ apelido: 'Tomatinho' })], url: '/historico/p1', agora });
  await screen.findByRole('header', { name: 'Histórico de regas' });

  fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));

  expect(screen).toHavePathname('/');
});

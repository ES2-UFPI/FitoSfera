import { act, fireEvent, screen, waitFor } from 'expo-router/testing-library';
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

describe('desfazer a rega', () => {
  test('o "Desfazer" apaga a rega que acabou de ser registrada, e o histórico volta a ficar vazio', async () => {
    const { regas } = renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora });

    fireEvent.press(await screen.findByRole('button', { name: 'Registrar rega' }));
    expect(await screen.findByText('✓ Rega registrada agora.')).toBeTruthy();
    expect(regas.salvas).toHaveLength(1);

    fireEvent.press(screen.getByRole('button', { name: 'Desfazer a rega registrada agora' }));
    expect(await screen.findByText('Rega desfeita.')).toBeTruthy();
    expect(regas.salvas).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Desfazer a rega registrada agora' })).toBeNull();
  });

  test('desfazer só apaga a rega de agora, não as anteriores', async () => {
    const { regas } = renderizarApp({
      plantas: [plantaDeTeste()],
      regas: [rega('antiga', new Date(2026, 9, 19, 18, 30))],
      url: '/planta/p1',
      agora,
    });

    fireEvent.press(await screen.findByRole('button', { name: 'Registrar rega' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Desfazer a rega registrada agora' }));
    expect(await screen.findByText('Rega desfeita.')).toBeTruthy();
    expect(regas.salvas.map((r) => r.id)).toEqual(['antiga']);
  });

  test('o botão e a confirmação somem depois de alguns segundos: o histórico já mostra a rega', async () => {
    jest.useFakeTimers();
    try {
      renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora });
      fireEvent.press(await screen.findByRole('button', { name: 'Registrar rega' }));
      expect(await screen.findByRole('button', { name: 'Desfazer a rega registrada agora' })).toBeTruthy();

      act(() => jest.advanceTimersByTime(8_000));
      expect(screen.queryByRole('button', { name: 'Desfazer a rega registrada agora' })).toBeNull();
      expect(screen.queryByText('✓ Rega registrada agora.')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  test('"Rega desfeita." também some depois de alguns segundos', async () => {
    jest.useFakeTimers();
    try {
      renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora });
      fireEvent.press(await screen.findByRole('button', { name: 'Registrar rega' }));
      fireEvent.press(await screen.findByRole('button', { name: 'Desfazer a rega registrada agora' }));
      expect(await screen.findByText('Rega desfeita.')).toBeTruthy();

      act(() => jest.advanceTimersByTime(4_000));
      expect(screen.queryByText('Rega desfeita.')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('rega de outro dia', () => {
  test('o link abre a data já com hoje, e registrar um dia passado grava ao meio-dia daquele dia', async () => {
    const { regas } = renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora });

    fireEvent.press(await screen.findByRole('button', { name: 'Regou em outro dia?' }));
    const campo = screen.getByLabelText('Data da rega');
    expect(campo.props.value).toBe('20/10/2026');

    fireEvent.changeText(campo, '18102026');
    expect(screen.getByLabelText('Data da rega').props.value).toBe('18/10/2026');
    fireEvent.press(screen.getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByText('✓ Rega de 18/10/2026 registrada.')).toBeTruthy();
    expect(regas.salvas.map((r) => r.regadaEm)).toEqual([new Date(2026, 9, 18, 12)]);
    expect(screen.queryByLabelText('Data da rega')).toBeNull();
    expect(screen.getByRole('button', { name: 'Desfazer a rega de 18/10/2026' })).toBeTruthy();
  });

  test('recusa um dia que ainda não chegou, sem gravar', async () => {
    const { regas } = renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora });

    fireEvent.press(await screen.findByRole('button', { name: 'Regou em outro dia?' }));
    fireEvent.changeText(screen.getByLabelText('Data da rega'), '21102026');
    fireEvent.press(screen.getByRole('button', { name: 'Registrar' }));

    expect(await screen.findByText('A rega não pode ser num dia que ainda não chegou.')).toBeTruthy();
    expect(regas.salvas).toEqual([]);
  });

  test('cancelar fecha o campo sem registrar', async () => {
    const { regas } = renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora });

    fireEvent.press(await screen.findByRole('button', { name: 'Regou em outro dia?' }));
    fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByLabelText('Data da rega')).toBeNull();
    expect(regas.salvas).toEqual([]);
  });
});

describe('apagar uma rega do histórico', () => {
  function abrirComDuasRegas() {
    return renderizarApp({
      plantas: [plantaDeTeste()],
      regas: [rega('r1', new Date(2026, 9, 19, 18, 30)), rega('r2', new Date(2026, 9, 18, 7, 15))],
      url: '/historico/p1',
      agora,
    });
  }

  test('pede confirmação com a data da rega e, confirmando, tira só ela da lista', async () => {
    const { regas } = abrirComDuasRegas();

    fireEvent.press(await screen.findByRole('button', { name: 'Apagar a rega de 19/10/2026 às 18:30' }));
    expect(screen.getByRole('header', { name: 'Apagar a rega de 19/10/2026 às 18:30?' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Apagar rega' }));

    await waitFor(() => expect(screen.queryByLabelText(/^19\/10\/2026 às 18:30/)).toBeNull());
    expect(screen.getByLabelText(/^18\/10\/2026 às 07:15/)).toBeTruthy();
    expect(screen.getByText('1 REGA REGISTRADA')).toBeTruthy();
    expect(regas.salvas.map((r) => r.id)).toEqual(['r2']);
  });

  test('cancelar não apaga nada', async () => {
    const { regas } = abrirComDuasRegas();
    fireEvent.press(await screen.findByRole('button', { name: 'Apagar a rega de 19/10/2026 às 18:30' }));
    fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('header', { name: /^Apagar a rega/ })).toBeNull());
    expect(regas.salvas).toHaveLength(2);
  });
});

test('se desfazer falhar, avisa e deixa o "Desfazer" para tentar de novo', async () => {
  const { container } = renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', agora });
  const apagarRega = jest.spyOn(container.apagarRegistros, 'apagarRega').mockRejectedValueOnce(new Error('disco cheio'));

  fireEvent.press(await screen.findByRole('button', { name: 'Registrar rega' }));
  fireEvent.press(await screen.findByRole('button', { name: 'Desfazer a rega registrada agora' }));
  expect(await screen.findByText('Não deu para desfazer a rega. Tente de novo.')).toBeTruthy();

  fireEvent.press(screen.getByRole('button', { name: 'Desfazer a rega registrada agora' }));
  expect(await screen.findByText('Rega desfeita.')).toBeTruthy();
  expect(apagarRega).toHaveBeenCalledTimes(2);
});

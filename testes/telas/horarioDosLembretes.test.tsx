import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { JANELA_PADRAO, JanelaDeLembretes } from '@/dominio/modelos/JanelaDeLembretes';
import { renderizarApp } from './apoio/renderizarApp';

const NOTURNA: JanelaDeLembretes = { inicio: { hora: 22, minuto: 30 }, fim: { hora: 7, minuto: 15 } };

describe('tela do horário dos lembretes', () => {
  test('abre mostrando o horário gravado, não o padrão', async () => {
    renderizarApp({ url: '/lembretes', janelaDeLembretes: NOTURNA });

    expect(await screen.findByLabelText('Começa às 22:30')).toBeTruthy();
    expect(screen.getByLabelText('Vai até 07:15')).toBeTruthy();
    expect(screen.getByText('Os avisos chegam das 22:30 às 07:15, atravessando a meia-noite.')).toBeTruthy();
  });

  test('sem nada escolhido antes, abre no padrão de 8h às 21h', async () => {
    renderizarApp({ url: '/lembretes' });

    expect(await screen.findByLabelText('Começa às 08:00')).toBeTruthy();
    expect(screen.getByLabelText('Vai até 21:00')).toBeTruthy();
  });

  test('cada ajuste é gravado na hora, de meia em meia hora', async () => {
    const { preferencias } = renderizarApp({ url: '/lembretes' });

    fireEvent.press(await screen.findByRole('button', { name: 'Atrasar o fim' }));

    expect(await screen.findByLabelText('Vai até 21:30')).toBeTruthy();
    await waitFor(() =>
      expect(preferencias.janelaGravada).toEqual({ inicio: { hora: 8, minuto: 0 }, fim: { hora: 21, minuto: 30 } }),
    );
  });

  test('dois toques seguidos somam e o último é o que fica gravado', async () => {
    const { preferencias } = renderizarApp({ url: '/lembretes' });

    const adiantar = await screen.findByRole('button', { name: 'Adiantar o início' });
    fireEvent.press(adiantar);
    fireEvent.press(adiantar);

    expect(await screen.findByLabelText('Começa às 07:00')).toBeTruthy();
    await waitFor(() => expect(preferencias.janelaGravada.inicio).toEqual({ hora: 7, minuto: 0 }));
  });

  test('o horário dá a volta na meia-noite em vez de travar', async () => {
    const madrugada: JanelaDeLembretes = { inicio: { hora: 0, minuto: 0 }, fim: { hora: 6, minuto: 0 } };
    renderizarApp({ url: '/lembretes', janelaDeLembretes: madrugada });

    fireEvent.press(await screen.findByRole('button', { name: 'Adiantar o início' }));

    expect(await screen.findByLabelText('Começa às 23:30')).toBeTruthy();
    expect(screen.getByText('Os avisos chegam das 23:30 às 06:00, atravessando a meia-noite.')).toBeTruthy();
  });

  test('o atalho do padrão aparece só quando o horário foi mudado, e volta a janela de 8h às 21h', async () => {
    const { preferencias } = renderizarApp({ url: '/lembretes', janelaDeLembretes: NOTURNA });

    fireEvent.press(await screen.findByRole('button', { name: 'Voltar ao horário padrão' }));

    expect(await screen.findByLabelText('Começa às 08:00')).toBeTruthy();
    await waitFor(() => expect(preferencias.janelaGravada).toEqual(JANELA_PADRAO));
    expect(screen.queryByRole('button', { name: 'Voltar ao horário padrão' })).toBeNull();
  });

  test('quando a preferência não dá para ler, avisa e mostra o padrão', async () => {
    renderizarApp({ url: '/lembretes', falharAoLerPreferencias: true });

    expect(await screen.findByText(/Não deu para ler o horário salvo/)).toBeTruthy();
    expect(screen.getByLabelText('Começa às 08:00')).toBeTruthy();
  });

  test('quando a gravação falha, a tela avisa em vez de dizer que salvou', async () => {
    renderizarApp({ url: '/lembretes', falharAoGravarPreferencias: true });

    fireEvent.press(await screen.findByRole('button', { name: 'Atrasar o fim' }));

    expect(await screen.findByText(/Não deu para guardar o horário/)).toBeTruthy();
  });
});

describe('lembretes nos ajustes', () => {
  test('o cartão mostra o horário gravado e leva para a tela que o muda', async () => {
    renderizarApp({ url: '/ajustes', janelaDeLembretes: NOTURNA });

    expect(
      await screen.findByText(
        'Os avisos chegam das 22:30 às 07:15, atravessando a meia-noite. Fora desse horário, eles esperam.',
      ),
    ).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Mudar o horário dos lembretes' }));
    await waitFor(() => expect(screen).toHavePathname('/lembretes'));
    expect(await screen.findByRole('header', { name: 'Horário dos lembretes' })).toBeTruthy();
  });

  test('ao voltar da tela de horário, o cartão já mostra o que foi escolhido', async () => {
    renderizarApp({ url: '/ajustes' });

    fireEvent.press(await screen.findByRole('button', { name: 'Mudar o horário dos lembretes' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Atrasar o fim' }));
    expect(await screen.findByLabelText('Vai até 21:30')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));

    expect(await screen.findByText('Os avisos chegam das 08:00 às 21:30. Fora desse horário, eles esperam.')).toBeTruthy();
  });
});

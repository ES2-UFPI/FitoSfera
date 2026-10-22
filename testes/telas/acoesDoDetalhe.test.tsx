import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { ALVO_DE_TOQUE } from '@/apresentacao/tema/medidas';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

const selecionado = (rotulo: string) => screen.getByRole('button', { name: rotulo }).props.accessibilityState.selected;

test('registrar rega, editar e excluir estão no detalhe, com alvo de toque de pelo menos 48 px', async () => {
  renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1' });

  for (const nome of ['Registrar rega', 'Editar', 'Excluir']) {
    const botao = await screen.findByRole('button', { name: nome });
    const estilo = [botao.props.style].flat(Infinity).reduce((total, parte) => ({ ...total, ...parte }), {});
    expect(estilo.minHeight).toBeGreaterThanOrEqual(ALVO_DE_TOQUE);
  }
});

describe('excluir', () => {
  test('cancelar a confirmação mantém a planta', async () => {
    const { plantas } = renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1' });
    fireEvent.press(await screen.findByRole('button', { name: 'Excluir' }));

    expect(await screen.findByRole('header', { name: 'Excluir Tomatinho?' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(screen.queryByRole('header', { name: 'Excluir Tomatinho?' })).toBeNull());
    expect(plantas.salvas).toHaveLength(1);
    expect(screen).toHavePathname('/planta/p1');
  });

  test('confirmar apaga a planta e as regas dela e volta ao jardim sem a planta', async () => {
    const { plantas, regas } = renderizarApp({
      plantas: [plantaDeTeste(), plantaDeTeste({ id: 'p2', apelido: 'Fica' })],
      url: '/planta/p1',
    });
    await regas.gravar({ id: 'r1', idPlanta: 'p1', regadaEm: new Date(2026, 9, 17, 8, 0) });

    fireEvent.press(await screen.findByRole('button', { name: 'Excluir' }));
    fireEvent.press(await screen.findByRole('button', { name: 'Excluir planta' }));

    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(plantas.salvas.map((planta) => planta.id)).toEqual(['p2']);
    expect(regas.salvas).toHaveLength(0);
    expect(await screen.findByLabelText('Fica. Sem dados. Toque para ver os detalhes.')).toBeTruthy();
    expect(screen.queryByLabelText(/^Tomatinho\./)).toBeNull();
  });
});

describe('editar', () => {
  test('reaproveita os passos do cadastro preenchidos e salva mantendo data de cadastro e regas', async () => {
    const cadastradaEm = new Date(2026, 9, 1, 9, 0);
    const { plantas, regas } = renderizarApp({ plantas: [plantaDeTeste({ cadastradaEm })], url: '/planta/p1' });
    const rega = { id: 'r1', idPlanta: 'p1', regadaEm: new Date(2026, 9, 17, 8, 0) };
    await regas.gravar(rega);

    fireEvent.press(await screen.findByRole('button', { name: 'Editar' }));
    expect(await screen.findByText('Mude a aparência da planta')).toBeTruthy();
    expect(selecionado('Forma: Erva')).toBe(true);
    expect(selecionado('Vaso: Terracota')).toBe(true);

    fireEvent.press(screen.getByRole('button', { name: 'Vaso: Azul' }));
    fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

    const campo = await screen.findByLabelText('Apelido da planta');
    expect(campo.props.value).toBe('Tomatinho');
    fireEvent.changeText(campo, 'Tomatão');
    fireEvent.press(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => expect(screen).toHavePathname('/planta/p1'));
    expect(await screen.findByRole('header', { name: 'Tomatão' })).toBeTruthy();
    expect(plantas.salvas).toHaveLength(1);
    expect(plantas.salvas[0]).toMatchObject({ id: 'p1', apelido: 'Tomatão', cadastradaEm });
    expect(plantas.salvas[0].aparencia.vaso).toBe('azul');
    expect(regas.salvas).toEqual([rega]);
  });

  test('a edição não mostra os passos do cadastro', async () => {
    renderizarApp({ plantas: [plantaDeTeste()], url: '/editar/p1' });
    expect(await screen.findByText('Mude a aparência da planta')).toBeTruthy();
    expect(screen.queryByLabelText(/^Passo \d de 3$/)).toBeNull();
  });

  test('planta inexistente mostra "Planta não encontrada"', async () => {
    renderizarApp({ url: '/editar/p9' });
    expect(await screen.findByText('Planta não encontrada')).toBeTruthy();
  });
});

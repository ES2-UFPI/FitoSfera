import { act, fireEvent, screen, waitFor, within } from 'expo-router/testing-library';
import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { especieDeTeste } from '../apoio/especiesDeTeste';
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

/**
 * A tela abre ordenando por dificuldade, e esta lista continua alfabética porque as cinco espécies de teste
 * têm os mesmos valores (rega 3, DLI mínimo 12, sem ficha) e saem todas `facil`: no empate, a ordenação
 * estável preserva a ordem alfabética que o repositório entregou.
 */
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
  expect(await screen.findByText('Não encontramos essa planta na nossa lista de espécies.')).toBeTruthy();
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
  expect(executar).toHaveBeenCalledWith({ termo: 'tom', filtro: 'todas', ordem: 'mais-faceis-primeiro' });

});

test('tocar numa espécie avança para o passo 2', async () => {
  renderizarApp({ url: '/cadastro' });
  fireEvent.press(await screen.findByRole('button', { name: /^Tomate\./ }));
  expect(screen).toHavePathname('/cadastro/aparencia');
});

test('o cabeçalho do cadastro marca o passo 1 de 3', async () => {
  renderizarApp({ url: '/cadastro' });
  expect(await screen.findByLabelText('Passo 1 de 3')).toBeTruthy();
  await screen.findAllByTestId('resultado-especie');
});

const fonte = 'Fonte de teste';
const fato = (presente: boolean) => ({ presente, fonte });

/**
 * O nível não é declarado: ele sai da conta. Por isso o que o teste informa são as **entradas** — rega em
 * dias, mínimo da faixa de DLI e os fatos de manejo —, e a asserção cobra o nível que elas produzem.
 */
function especieCom(
  nomeComum: string,
  rega: number,
  luzDiaria: number,
  fatos: { praga?: boolean; encharcamento?: boolean; manejo?: boolean } = {},
): EspecieVegetal {
  const base = especieDeTeste({ id: nomeComum.toLowerCase(), nomeComum, nomeCientifico: 'X x', nomesAlternativos: [] });
  return {
    ...base,
    intervaloDeRegaEmDias: rega,
    faixasIdeais: { ...base.faixasIdeais!, luzDiaria: { minimo: luzDiaria, maximo: 30, fonte } },
    exigencias: {
      exigeControleDePraga: fato(fatos.praga ?? false),
      morreComEncharcamento: fato(fatos.encharcamento ?? false),
      exigeManejoEstrutural: fato(fatos.manejo ?? false),
    },
  };
}

describe('o nível de dificuldade ao lado da espécie', () => {
  // Uma espécie de cada nível, em ordem alfabética, com a conta que leva a ele.
  const especies = [
    especieCom('Jiboia', 7, 3), //                              0 + 0 + 0 = 0 → fácil
    especieCom('Samambaia', 2, 12, { encharcamento: true }), //  2 + 1 + 1 = 4 → médio
    especieCom('Tomate', 1, 18, { manejo: true }), //            2 + 2 + 1 = 5 → exigente
  ];

  test('mostra o selo do nível em toda espécie da lista', async () => {
    renderizarApp({ url: '/cadastro', especies });
    const resultados = await screen.findAllByTestId('resultado-especie');
    const selos = resultados.map((item) => within(item).getByTestId('selo-dificuldade').props.children);
    expect(selos).toEqual(['fácil', 'médio', 'exigente']);
  });

  test('lista o que pesou em médio e em difícil, e não escreve nada em fácil', async () => {
    renderizarApp({ url: '/cadastro', especies });
    const resultados = await screen.findAllByTestId('resultado-especie');
    const motivos = resultados.map((item) =>
      within(item)
        .queryAllByTestId('motivo-da-dificuldade')
        .map((linha) => linha.props.children),
    );
    expect(motivos).toEqual([
      [],
      ['Necessita de rega frequente', 'Cuidado com encharcamento. A planta morre se encharcar'],
      ['Necessita de rega frequente', 'Necessita de sol pleno', 'Necessita de poda ou tutor'],
    ]);
  });

  test('a espécie fácil não ganha lista nenhuma', async () => {
    renderizarApp({ url: '/cadastro', especies });
    const resultados = await screen.findAllByTestId('resultado-especie');
    expect(within(resultados[0]).queryByTestId('observacao-dificuldade')).toBeNull();
  });

  test('o leitor de tela ouve o nome e, depois, o nível', async () => {
    renderizarApp({ url: '/cadastro', especies });
    expect(await screen.findByLabelText('Jiboia. Fácil de cuidar.')).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Tomate. Exigente: Necessita de rega frequente. Necessita de sol pleno. Necessita de poda ou tutor.',
      ),
    ).toBeTruthy();
  });
});

describe('o controle de dificuldade da busca', () => {
  /** Alfabética e "mais fáceis primeiro" dão ordens opostas aqui, senão o teste da ordem não provaria nada. */
  const especies = [
    especieCom('Alface', 1, 18, { manejo: true }), //      2 + 2 + 1 = 5 → exigente
    especieCom('Boldo', 2, 12, { encharcamento: true }), // 2 + 1 + 1 = 4 → médio
    especieCom('Cacto', 7, 3), //                          0 + 0 + 0 = 0 → fácil
  ];

  const marcada = (modo: string) =>
    screen.getByTestId(`opcao-da-busca-${modo}`).props.accessibilityState?.checked;

  test('abre com "Mais fáceis primeiro" escolhida', async () => {
    renderizarApp({ url: '/cadastro', especies });
    await screen.findAllByTestId('resultado-especie');
    expect(marcada('mais-faceis-primeiro')).toBe(true);
    expect(marcada('todas')).toBe(false);
    expect(marcada('faceis')).toBe(false);
  });

  test('o padrão põe as mais fáceis no topo e as exigentes no fim', async () => {
    renderizarApp({ url: '/cadastro', especies });
    expect(await nomesListados()).toEqual(['Cacto', 'Boldo', 'Alface']);
  });

  test('"Todas" volta para a ordem alfabética', async () => {
    renderizarApp({ url: '/cadastro', especies });
    await screen.findAllByTestId('resultado-especie');
    fireEvent.press(screen.getByTestId('opcao-da-busca-todas'));
    await waitFor(async () => expect(await nomesListados()).toEqual(['Alface', 'Boldo', 'Cacto']));
    expect(marcada('todas')).toBe(true);
  });

  test('"Fáceis" esconde a média e a exigente', async () => {
    renderizarApp({ url: '/cadastro', especies });
    await screen.findAllByTestId('resultado-especie');
    fireEvent.press(screen.getByTestId('opcao-da-busca-faceis'));
    await waitFor(async () => expect(await nomesListados()).toEqual(['Cacto']));
  });

  test('com "Fáceis" ligado, a lista vazia culpa o filtro, e não o catálogo', async () => {
    renderizarApp({ url: '/cadastro', especies });
    await screen.findAllByTestId('resultado-especie');
    fireEvent.press(screen.getByTestId('opcao-da-busca-faceis'));
    fireEvent.changeText(screen.getByPlaceholderText('Nome da planta'), 'alface');

    expect(await screen.findByText(/Nenhuma planta fácil/)).toBeTruthy();
    expect(screen.queryByText('Não encontramos essa planta na nossa lista de espécies.')).toBeNull();
  });

  test('trocar de opção responde na hora, sem esperar o debounce da digitação', async () => {
    renderizarApp({ url: '/cadastro', especies });
    await screen.findAllByTestId('resultado-especie');
    jest.useFakeTimers();

    fireEvent.press(screen.getByTestId('opcao-da-busca-faceis'));
    // Nenhum avanço de relógio: só a resolução da promessa da busca.
    await act(async () => {});

    expect(screen.getAllByTestId('resultado-especie')).toHaveLength(1);
  });
});

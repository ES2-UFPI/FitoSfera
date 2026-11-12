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
  expect(executar).toHaveBeenCalledWith('tom');

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

describe('o nível de dificuldade ao lado da espécie', () => {
  const fonte = 'Fonte de teste';
  /** `luzDiaria` é o mínimo da faixa de DLI, em mol/m²/dia, como no catálogo. */
  const comDificuldade = (
    nomeComum: string,
    nivel: EspecieVegetal['nivelDeDificuldade'],
    rega: number,
    luzDiaria: number,
  ): EspecieVegetal => {
    const base = especieDeTeste({ id: nomeComum.toLowerCase(), nomeComum, nomeCientifico: 'X x', nomesAlternativos: [] });
    return {
      ...base,
      nivelDeDificuldade: nivel,
      intervaloDeRegaEmDias: rega,
      faixasIdeais: { ...base.faixasIdeais!, luzDiaria: { minimo: luzDiaria, maximo: 30, fonte } },
    };
  };

  // Os três com os valores que eles têm no catálogo de verdade.
  const especies = [
    comDificuldade('Jiboia', 'facil', 7, 3),
    comDificuldade('Samambaia', 'medio', 2, 3),
    comDificuldade('Tomate', 'dificil', 1, 18),
  ];

  test('mostra o selo do nível em toda espécie da lista', async () => {
    renderizarApp({ url: '/cadastro', especies });
    const resultados = await screen.findAllByTestId('resultado-especie');
    const selos = resultados.map((item) => within(item).getByTestId('selo-dificuldade').props.children);
    expect(selos).toEqual(['fácil', 'médio', 'difícil']);
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
      ['Necessita de rega frequente'],
      ['Necessita de rega frequente', 'Necessita de sol pleno'],
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
      screen.getByLabelText('Tomate. Difícil: Necessita de rega frequente. Necessita de sol pleno.'),
    ).toBeTruthy();
  });
});

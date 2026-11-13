import { screen } from 'expo-router/testing-library';
import { especieDeTeste } from '../apoio/especiesDeTeste';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

const agora = new Date(2026, 9, 17, 14, 0);
const tomate = especieDeTeste(
  { id: 'tomate', nomeComum: 'Tomate', nomeCientifico: 'Solanum lycopersicum', nomesAlternativos: [] },
  {
    frutifera: true,
    tempoMedioAteColheitaEmDias: 75,
    estagiosDeDesenvolvimento: [
      { nome: 'muda', duracaoEmDias: 10 },
      { nome: 'floração', duracaoEmDias: 20 },
      { nome: 'frutificação', duracaoEmDias: 45 },
    ],
  },
);

test('mostra prazo e estágio atual no detalhe de uma frutífera', async () => {
  renderizarApp({
    plantas: [plantaDeTeste({ cadastradaEm: new Date(2026, 9, 12, 14, 0) })],
    especies: [tomate],
    url: '/planta/p1',
    agora,
  });

  expect(await screen.findByRole('header', { name: 'Expectativa de colheita' })).toBeTruthy();
  expect(screen.getByText('Faltam cerca de 70 dias')).toBeTruthy();
  expect(screen.getByText('Estágio: muda')).toBeTruthy();
});

test('não mostra o bloco para uma espécie não frutífera', async () => {
  renderizarApp({ plantas: [plantaDeTeste({ idEspecie: 'jiboia' })], url: '/planta/p1', agora });
  await screen.findByRole('header', { name: 'Rega e histórico' });
  expect(screen.queryByRole('header', { name: 'Expectativa de colheita' })).toBeNull();
});

test('mostra estimativa indisponível quando faltam dados necessários', async () => {
  renderizarApp({
    plantas: [plantaDeTeste({ cadastradaEm: null })],
    especies: [tomate],
    url: '/planta/p1',
    agora,
  });

  expect(await screen.findByText('Estimativa indisponível')).toBeTruthy();
  expect(screen.queryByText(/Faltam cerca de/)).toBeNull();
});

test('mostra estimativa indisponível quando a espécie não tem ciclo médio cadastrado', async () => {
  renderizarApp({
    plantas: [plantaDeTeste()],
    especies: [{ ...tomate, tempoMedioAteColheitaEmDias: undefined }],
    url: '/planta/p1',
    agora,
  });

  expect(await screen.findByText('Estimativa indisponível')).toBeTruthy();
  expect(screen.queryByText(/Faltam cerca de/)).toBeNull();
});

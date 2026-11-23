import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { JARDIM_PRINCIPAL } from '@/dominio/modelos/Jardim';
import { PareamentoDoSensor } from '@/aplicacao/portas/PareamentoDoSensor';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

test('trocar de jardim mostra apenas as plantas cadastradas nele', async () => {
  renderizarApp({
    jardins: [JARDIM_PRINCIPAL, { id: 'sala', nome: 'Sala', idSensor: null }],
    plantas: [plantaDeTeste({ id: 'p1', apelido: 'Varanda' }),
      plantaDeTeste({ id: 'p2', apelido: 'Samambaia', idJardim: 'sala' })],
  });
  expect(await screen.findByLabelText('Varanda. Sem dados. Toque para ver os detalhes.')).toBeTruthy();
  expect(screen.queryByText('Samambaia')).toBeNull();

  fireEvent.press(screen.getByRole('button', { name: 'Trocar ou criar jardim' }));
  fireEvent.press(screen.getByRole('button', { name: 'Sala' }));
  expect(await screen.findByLabelText('Samambaia. Sem dados. Toque para ver os detalhes.')).toBeTruthy();
  expect(screen.queryByText('Varanda')).toBeNull();
});

test('tocar no jardim que já está aberto mantém as plantas na estante', async () => {
  renderizarApp({
    jardins: [JARDIM_PRINCIPAL, { id: 'sala', nome: 'Sala', idSensor: null }],
    plantas: [plantaDeTeste({ id: 'p1', apelido: 'Alecrim' })],
  });
  expect(await screen.findByLabelText('Alecrim. Sem dados. Toque para ver os detalhes.')).toBeTruthy();

  fireEvent.press(screen.getByRole('button', { name: 'Trocar ou criar jardim' }));
  fireEvent.press(screen.getByRole('button', { name: 'Jardim principal', selected: true }));
  // O seletor fecha quando a troca termina; a partir daí, a estante não pode ficar esperando uma recarga.
  await waitFor(() => expect(screen.queryByRole('header', { name: 'Seus jardins' })).toBeNull());

  expect(await screen.findByLabelText('Alecrim. Sem dados. Toque para ver os detalhes.')).toBeTruthy();
  expect(screen.getByText('1 planta neste espaço')).toBeTruthy();
});

test('sensor associado a um jardim não pode ser associado ao outro', async () => {
  const sensor = { id: 'ble-01', nome: 'FitoSfera' };
  const pareamento: PareamentoDoSensor = {
    pedirPermissoes: async () => true,
    procurar: () => () => undefined,
    parear: async () => ({ umidadePercentual: 55, temperaturaCelsius: 24, luminosidadeLux: 900,
      medidaEm: new Date() }),
    obterPareado: async () => sensor,
    listarPareados: async () => [sensor],
    esquecer: async () => undefined,
  };
  renderizarApp({
    jardins: [JARDIM_PRINCIPAL, { id: 'sala', nome: 'Sala', idSensor: null }],
    pareamentoDoSensor: pareamento,
  });
  expect(screen.queryByRole('button', { name: 'Usar FitoSfera · final BE01' })).toBeNull();
  fireEvent.press(await screen.findByRole('button', { name: 'Mostrar opções do sensor' }));
  fireEvent.press(await screen.findByRole('button', { name: 'Usar FitoSfera · final BE01' }));
  fireEvent.press(screen.getByRole('button', { name: 'Trocar ou criar jardim' }));
  fireEvent.press(screen.getByRole('button', { name: 'Sala' }));
  await waitFor(() => expect(screen.queryByRole('header', { name: 'Seus jardins' })).toBeNull());
  fireEvent.press(await screen.findByRole('button', { name: 'Usar FitoSfera · final BE01' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Este sensor já está em uso em outro jardim.');
});

test('o seletor mostra quantas plantas tem cada jardim, e não só o aberto', async () => {
  renderizarApp({
    jardins: [JARDIM_PRINCIPAL, { id: 'sala', nome: 'Sala', idSensor: null }, { id: 'varanda', nome: 'Varanda', idSensor: null }],
    plantas: [plantaDeTeste({ id: 'p1', apelido: 'Alecrim' }),
      plantaDeTeste({ id: 'p2', apelido: 'Samambaia', idJardim: 'sala' }),
      plantaDeTeste({ id: 'p3', apelido: 'Hortelã', idJardim: 'sala' })],
  });
  expect(await screen.findByLabelText('Alecrim. Sem dados. Toque para ver os detalhes.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Trocar ou criar jardim' }));
  expect(await screen.findByText('2 plantas')).toBeTruthy();
  expect(screen.getByText('1 planta')).toBeTruthy();
  expect(screen.getByText('Nenhuma planta ainda')).toBeTruthy();
  expect(screen.queryByText('Toque para abrir')).toBeNull();
});

describe('link ou notificação para planta de outro jardim', () => {
  const jardins = [JARDIM_PRINCIPAL, { id: 'sala', nome: 'Sala', idSensor: null }];
  const plantas = [
    plantaDeTeste({ id: 'p1', apelido: 'Alecrim' }),
    plantaDeTeste({ id: 'p2', apelido: 'Samambaia', idJardim: 'sala', idEspecie: 'jiboia' }),
  ];

  test('o detalhe abre a planta e passa a mostrar o jardim dela', async () => {
    const { container } = renderizarApp({ jardins, plantas, url: '/planta/p2' });

    expect(await screen.findByRole('header', { name: 'Samambaia' })).toBeTruthy();
    expect(screen.queryByText('Planta não encontrada')).toBeNull();
    expect(await container.gerenciarJardins.obterSelecionado()).toBe('sala');
  });

  test('o histórico de regas também abre', async () => {
    renderizarApp({ jardins, plantas, url: '/historico/p2' });
    expect(await screen.findByText('Samambaia')).toBeTruthy();
  });

  test('uma planta que não existe continua como não encontrada', async () => {
    renderizarApp({ jardins, plantas, url: '/planta/p9' });
    expect(await screen.findByText('Planta não encontrada')).toBeTruthy();
  });
});

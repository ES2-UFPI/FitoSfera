import { fireEvent, screen } from 'expo-router/testing-library';
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

  fireEvent.press(screen.getByRole('button', { name: 'Trocar de jardim. Atual: Jardim principal' }));
  fireEvent.press(screen.getByRole('button', { name: 'Sala' }));
  expect(await screen.findByLabelText('Samambaia. Sem dados. Toque para ver os detalhes.')).toBeTruthy();
  expect(screen.queryByText('Varanda')).toBeNull();
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
  fireEvent.press(await screen.findByRole('button', { name: 'Associar ou trocar sensor' }));
  fireEvent.press(screen.getByRole('button', { name: 'Associar FitoSfera · le-01' }));
  fireEvent.press(screen.getByRole('button', { name: 'Trocar de jardim. Atual: Jardim principal' }));
  fireEvent.press(screen.getByRole('button', { name: 'Sala' }));
  expect(await screen.findByRole('button', { name: 'Trocar de jardim. Atual: Sala' })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Associar ou trocar sensor' }));
  fireEvent.press(screen.getByRole('button', { name: 'Associar FitoSfera · le-01' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Este sensor já está associado a outro jardim.');
});

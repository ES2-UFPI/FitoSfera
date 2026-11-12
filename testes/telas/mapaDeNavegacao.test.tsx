import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { PareamentoDoSensor } from '@/aplicacao/portas/PareamentoDoSensor';
import { JARDIM_PRINCIPAL } from '@/dominio/modelos/Jardim';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

/**
 * O orçamento de toques do mapa de navegação do README: cada função principal fica a no máximo dois toques
 * da tela inicial (a aba Jardim). Um caminho que crescer quebra este teste.
 */
const LIMITE_DE_TOQUES = 2;

const pareamento: PareamentoDoSensor = {
  pedirPermissoes: async () => true,
  procurar: () => () => undefined,
  parear: async () => ({ umidadePercentual: 55, temperaturaCelsius: 24, luminosidadeLux: 900, medidaEm: new Date() }),
  obterPareado: async () => null,
  listarPareados: async () => [],
  esquecer: async () => undefined,
};

function abrirAppNoJardim() {
  const app = renderizarApp({
    jardins: [JARDIM_PRINCIPAL, { id: 'sala', nome: 'Sala', idSensor: null }],
    plantas: [plantaDeTeste({ id: 'p1', apelido: 'Tomatinho' })],
    pareamentoDoSensor: pareamento,
  });
  let toques = 0;
  const tocar = async (elemento: Promise<Parameters<typeof fireEvent.press>[0]>) => {
    fireEvent.press(await elemento);
    toques++;
  };
  return { ...app, tocar, toques: () => toques };
}

const vaso = () => screen.findByLabelText('Tomatinho. Sem dados. Toque para ver os detalhes.');
const botao = (nome: string) => screen.findByRole('button', { name: nome });

test('o app abre no Jardim, sem nenhum toque', async () => {
  const { toques } = abrirAppNoJardim();
  expect(await vaso()).toBeTruthy();
  expect(screen).toHavePathname('/');
  expect(toques()).toBe(0);
});

test('cadastro: 1 toque até começar a cadastrar', async () => {
  const { tocar, toques } = abrirAppNoJardim();
  await tocar(botao('Nova planta'));
  await waitFor(() => expect(screen).toHavePathname('/cadastro'));
  expect(toques()).toBeLessThanOrEqual(LIMITE_DE_TOQUES);
});

test('detalhe da planta: 1 toque', async () => {
  const { tocar, toques } = abrirAppNoJardim();
  await tocar(vaso());
  await waitFor(() => expect(screen).toHavePathname('/planta/p1'));
  expect(toques()).toBeLessThanOrEqual(LIMITE_DE_TOQUES);
});

test('registrar rega: 2 toques', async () => {
  const { tocar, toques, regas } = abrirAppNoJardim();
  await tocar(vaso());
  await tocar(botao('Registrar rega'));
  await waitFor(() => expect(regas.salvas).toHaveLength(1));
  expect(toques()).toBeLessThanOrEqual(LIMITE_DE_TOQUES);
});

test.each([
  ['todas as regas', 'Ver todas as regas', '/historico/p1'],
  ['editar a planta', 'Editar', '/editar/p1'],
])('%s: 2 toques', async (_funcao, nomeDoBotao, destino) => {
  const { tocar, toques } = abrirAppNoJardim();
  await tocar(vaso());
  await tocar(botao(nomeDoBotao));
  await waitFor(() => expect(screen).toHavePathname(destino));
  expect(toques()).toBeLessThanOrEqual(LIMITE_DE_TOQUES);
});

test('excluir a planta: 2 toques até a confirmação', async () => {
  const { tocar, toques } = abrirAppNoJardim();
  await tocar(vaso());
  await tocar(botao('Excluir'));
  expect(await screen.findByRole('header', { name: 'Excluir Tomatinho?' })).toBeTruthy();
  expect(toques()).toBeLessThanOrEqual(LIMITE_DE_TOQUES);
});

test('trocar de jardim: 2 toques', async () => {
  const { tocar, toques } = abrirAppNoJardim();
  await tocar(botao('Trocar ou criar jardim'));
  await tocar(botao('Sala'));
  await waitFor(() => expect(screen.queryByRole('header', { name: 'Seus jardins' })).toBeNull());
  expect(screen.getByRole('button', { name: 'Trocar ou criar jardim' })).toHaveProp(
    'accessibilityHint',
    'Jardim atual: Sala',
  );
  expect(toques()).toBeLessThanOrEqual(LIMITE_DE_TOQUES);
});

test('parear um sensor: 2 toques', async () => {
  const { tocar, toques } = abrirAppNoJardim();
  await tocar(botao('Mostrar opções do sensor'));
  await tocar(botao('Parear novo sensor'));
  await waitFor(() => expect(screen).toHavePathname('/sensor'));
  expect(toques()).toBeLessThanOrEqual(LIMITE_DE_TOQUES);
});

test('comparar o rendimento de uma planta frutífera: 2 toques', async () => {
  const { tocar, toques } = abrirAppNoJardim();
  await tocar(vaso());
  await tocar(botao('Comparar com outras plantas'));
  await waitFor(() => expect(screen).toHavePathname('/rendimento'));
  expect(toques()).toBeLessThanOrEqual(LIMITE_DE_TOQUES);
});

test('horário dos lembretes: 2 toques, pela aba Ajustes', async () => {
  const { tocar, toques } = abrirAppNoJardim();
  await vaso();
  await tocar(Promise.resolve(screen.getByText('Ajustes')));
  await tocar(botao('Mudar o horário dos lembretes'));
  await waitFor(() => expect(screen).toHavePathname('/lembretes'));
  expect(toques()).toBeLessThanOrEqual(LIMITE_DE_TOQUES);
});

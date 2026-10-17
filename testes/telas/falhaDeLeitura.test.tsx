import { screen } from 'expo-router/testing-library';
import { renderizarApp } from './apoio/renderizarApp';

let aviso: jest.SpyInstance;
beforeEach(() => {
  aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => aviso.mockRestore());

test('se o armazenamento falhar ao ler, o jardim abre vazio em vez de travar', async () => {
  renderizarApp({ falharAoLer: true });
  expect(await screen.findByText('Monte sua primeira planta')).toBeTruthy();
  expect(aviso).toHaveBeenCalled();
});

test('se o armazenamento falhar ao ler a planta, o detalhe avisa em vez de ficar em branco', async () => {
  renderizarApp({ falharAoLer: true, url: '/planta/p1' });
  expect(await screen.findByText('Não deu para abrir esta planta agora.')).toBeTruthy();
});

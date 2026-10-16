import { renderRouter, screen } from 'expo-router/testing-library';
import LayoutDasAbas from '../../app/(abas)/_layout';
import RotaAjustes from '../../app/(abas)/ajustes';
import RotaAmbiente from '../../app/(abas)/ambiente';
import RotaJardim from '../../app/(abas)/index';
import LayoutRaiz from '../../app/_layout';
import LayoutDoCadastro from '../../app/cadastro/_layout';
import RotaBuscarEspecie from '../../app/cadastro/index';
import RotaPlanta from '../../app/planta/[id]';

jest.mock('expo-font', () => ({
  ...jest.requireActual('expo-font'),
  useFonts: () => [false, new Error('as fontes não carregaram')],
}));

test('se as fontes não carregarem, o app abre mesmo assim, com a fonte do sistema', async () => {
  // Os layouts de verdade declaram todas as telas, então todas entram no mapa.
  renderRouter(
    {
      _layout: LayoutRaiz,
      '(abas)/_layout': LayoutDasAbas,
      '(abas)/index': RotaJardim,
      '(abas)/ambiente': RotaAmbiente,
      '(abas)/ajustes': RotaAjustes,
      'cadastro/_layout': LayoutDoCadastro,
      'cadastro/index': RotaBuscarEspecie,
      'planta/[id]': RotaPlanta,
    },
    { initialUrl: '/' },
  );
  expect(await screen.findByText('Seu cantinho verde')).toBeTruthy();
});

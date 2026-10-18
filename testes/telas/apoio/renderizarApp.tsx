import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { Leitura } from '@/dominio/modelos/Leitura';
import { Planta } from '@/dominio/modelos/Planta';
import { ProvedorDoAplicativo } from '@/apresentacao/contextos/ContextoDoAplicativo';
import LayoutDasAbas from '../../../app/(abas)/_layout';
import RotaAjustes from '../../../app/(abas)/ajustes';
import RotaAmbiente from '../../../app/(abas)/ambiente';
import RotaJardim from '../../../app/(abas)/index';
import LayoutDoCadastro from '../../../app/cadastro/_layout';
import RotaBatizar from '../../../app/cadastro/apelido';
import RotaMontarAparencia from '../../../app/cadastro/aparencia';
import RotaBuscarEspecie from '../../../app/cadastro/index';
import RotaPlanta from '../../../app/planta/[id]';
import {
  criarContainerDeTeste,
  RepositorioDePlantasEmMemoria,
  RepositorioDeRegasEmMemoria,
} from '../../apoio/fakes';

/**
 * Sobe o app com as rotas reais de `app/`, trocando só o layout raiz por um que injeta
 * um container em memória (sem fontes, sem abertura animada).
 */
export function renderizarApp(
  opcoes: {
    plantas?: Planta[];
    especies?: readonly EspecieVegetal[];
    url?: string;
    falharAoLer?: boolean;
    leitura?: Leitura | null | 'falha';
    agora?: Date;
    falharAoRegistrarRega?: boolean;
  } = {},
): { plantas: RepositorioDePlantasEmMemoria; regas: RepositorioDeRegasEmMemoria } {
  const { container, plantas, regas } = criarContainerDeTeste({
    plantas: opcoes.plantas,
    especies: opcoes.especies,
    falharAoLer: opcoes.falharAoLer,
    leitura: opcoes.leitura,
    agora: opcoes.agora,
    falharAoRegistrarRega: opcoes.falharAoRegistrarRega,
  });

  function LayoutDeTeste() {
    return (
      <ProvedorDoAplicativo container={container}>
        <Stack screenOptions={{ headerShown: false }} />
      </ProvedorDoAplicativo>
    );
  }

  renderRouter(
    {
      _layout: LayoutDeTeste,
      '(abas)/_layout': LayoutDasAbas,
      '(abas)/index': RotaJardim,
      '(abas)/ambiente': RotaAmbiente,
      '(abas)/ajustes': RotaAjustes,
      'cadastro/_layout': LayoutDoCadastro,
      'cadastro/index': RotaBuscarEspecie,
      'cadastro/aparencia': RotaMontarAparencia,
      'cadastro/apelido': RotaBatizar,
      'planta/[id]': RotaPlanta,
    },
    { initialUrl: opcoes.url ?? '/' },
  );
  return { plantas, regas };
}

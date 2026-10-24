import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { ControleDoSensorDeDesenvolvimento } from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { ToqueNaNotificacao } from '@/aplicacao/portas/ToquesNaNotificacao';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { Leitura } from '@/dominio/modelos/Leitura';
import { Planta } from '@/dominio/modelos/Planta';
import { Rega } from '@/dominio/modelos/Rega';
import { SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { ProvedorDoAplicativo } from '@/apresentacao/contextos/ContextoDoAplicativo';
import { useAberturaPelaNotificacao } from '@/apresentacao/notificacoes/useAberturaPelaNotificacao';
import LayoutDasAbas from '../../../app/(abas)/_layout';
import RotaAjustes from '../../../app/(abas)/ajustes';
import RotaAmbiente from '../../../app/(abas)/ambiente';
import RotaJardim from '../../../app/(abas)/index';
import LayoutDoCadastro from '../../../app/cadastro/_layout';
import RotaBatizar from '../../../app/cadastro/apelido';
import RotaMontarAparencia from '../../../app/cadastro/aparencia';
import RotaBuscarEspecie from '../../../app/cadastro/index';
import LayoutDaEdicao from '../../../app/editar/[id]/_layout';
import RotaEditarApelido from '../../../app/editar/[id]/apelido';
import RotaEditarAparencia from '../../../app/editar/[id]/index';
import RotaPlanta from '../../../app/planta/[id]';
import {
  criarContainerDeTeste,
  NotificadorFalso,
  RepositorioDeAvisosEmMemoria,
  RepositorioDePlantasEmMemoria,
  RepositorioDeRegasEmMemoria,
  ToquesNaNotificacaoFalso,
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
    falhaAoCadastrar?: boolean;
    leitura?: Leitura | null | 'falha';
    sensor?: SensorDeAmbiente;
    agora?: Date;
    falharAoRegistrarRega?: boolean;
    regas?: readonly Rega[];
    controleDoSensorDeDesenvolvimento?: ControleDoSensorDeDesenvolvimento | null;
    toqueDeAbertura?: ToqueNaNotificacao | null;
    permitirNotificacao?: boolean;
  } = {},
): {
  plantas: RepositorioDePlantasEmMemoria;
  regas: RepositorioDeRegasEmMemoria;
  notificador: NotificadorFalso;
  avisos: RepositorioDeAvisosEmMemoria;
  toques: ToquesNaNotificacaoFalso;
} {
  const { container, plantas, regas, notificador, avisos, toques } = criarContainerDeTeste({
    plantas: opcoes.plantas,
    especies: opcoes.especies,
    falharAoLer: opcoes.falharAoLer,
    falhaAoCadastrar: opcoes.falhaAoCadastrar,
    leitura: opcoes.leitura,
    sensor: opcoes.sensor,
    agora: opcoes.agora,
    falharAoRegistrarRega: opcoes.falharAoRegistrarRega,
    regas: opcoes.regas,
    controleDoSensorDeDesenvolvimento: opcoes.controleDoSensorDeDesenvolvimento,
    toqueDeAbertura: opcoes.toqueDeAbertura,
    permitirNotificacao: opcoes.permitirNotificacao,
  });

  function LayoutDeTeste() {
    return (
      <ProvedorDoAplicativo container={container}>
        <NavegacaoDeTeste />
      </ProvedorDoAplicativo>
    );
  }

  // O layout real pendura aqui a abertura pela notificação; sem isto, nenhum teste a exercitaria.
  function NavegacaoDeTeste() {
    useAberturaPelaNotificacao();
    return <Stack screenOptions={{ headerShown: false }} />;
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
      'editar/[id]/_layout': LayoutDaEdicao,
      'editar/[id]/index': RotaEditarAparencia,
      'editar/[id]/apelido': RotaEditarApelido,
    },
    { initialUrl: opcoes.url ?? '/' },
  );
  return { plantas, regas, notificador, avisos, toques };
}

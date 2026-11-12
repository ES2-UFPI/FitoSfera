import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { ControleDoSensorDeDesenvolvimento } from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { ToqueNaNotificacao } from '@/aplicacao/portas/ToquesNaNotificacao';
import { PareamentoDoSensor } from '@/aplicacao/portas/PareamentoDoSensor';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { JanelaDeLembretes } from '@/dominio/modelos/JanelaDeLembretes';
import { Leitura } from '@/dominio/modelos/Leitura';
import { Planta } from '@/dominio/modelos/Planta';
import { Jardim } from '@/dominio/modelos/Jardim';
import { Rega } from '@/dominio/modelos/Rega';
import { RegistroDeColheita } from '@/dominio/modelos/RegistroDeColheita';
import { PeriodoDeLuz } from '@/dominio/regras/LuzRecebida';
import { SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { Container } from '@/composicao/Container';
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
import RotaHistorico from '../../../app/historico/[id]';
import RotaLembretes from '../../../app/lembretes';
import RotaPlanta from '../../../app/planta/[id]';
import RotaRendimento from '../../../app/rendimento';
import RotaSensor from '../../../app/sensor';
import {
  criarContainerDeTeste,
  NotificadorFalso,
  RegistroDeLuzEmMemoria,
  RelogioParado,
  RepositorioDeAvisosEmMemoria,
  RepositorioDePlantasEmMemoria,
  RepositorioDePreferenciasEmMemoria,
  RepositorioDeColheitasEmMemoria,
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
    jardins?: Jardim[];
    especies?: readonly EspecieVegetal[];
    url?: string;
    falharAoLer?: boolean;
    falhaAoCadastrar?: boolean;
    leitura?: Leitura | null | 'falha';
    sensor?: SensorDeAmbiente;
    agora?: Date;
    falharAoRegistrarRega?: boolean;
    regas?: readonly Rega[];
    colheitas?: readonly RegistroDeColheita[];
    falharAoRegistrarColheita?: boolean;
    controleDoSensorDeDesenvolvimento?: ControleDoSensorDeDesenvolvimento | null;
    toqueDeAbertura?: ToqueNaNotificacao | null;
    pareamentoDoSensor?: PareamentoDoSensor | null;
    permitirNotificacao?: boolean;
    janelaDeLembretes?: JanelaDeLembretes;
    falharAoLerPreferencias?: boolean;
    falharAoGravarPreferencias?: boolean;
    luz?: { periodos: readonly PeriodoDeLuz[]; ultimoContato: Date | null };
  } = {},
): {
  container: Container;
  luz: RegistroDeLuzEmMemoria;
  relogio: RelogioParado;
  plantas: RepositorioDePlantasEmMemoria;
  regas: RepositorioDeRegasEmMemoria;
  colheitas: RepositorioDeColheitasEmMemoria;
  notificador: NotificadorFalso;
  avisos: RepositorioDeAvisosEmMemoria;
  toques: ToquesNaNotificacaoFalso;
  preferencias: RepositorioDePreferenciasEmMemoria;
} {
  const { container, luz, relogio, plantas, regas, colheitas, notificador, avisos, toques, preferencias } =
    criarContainerDeTeste({
    plantas: opcoes.plantas,
    jardins: opcoes.jardins,
    especies: opcoes.especies,
    falharAoLer: opcoes.falharAoLer,
    falhaAoCadastrar: opcoes.falhaAoCadastrar,
    leitura: opcoes.leitura,
    sensor: opcoes.sensor,
    agora: opcoes.agora,
    falharAoRegistrarRega: opcoes.falharAoRegistrarRega,
    regas: opcoes.regas,
    colheitas: opcoes.colheitas,
    falharAoRegistrarColheita: opcoes.falharAoRegistrarColheita,
    controleDoSensorDeDesenvolvimento: opcoes.controleDoSensorDeDesenvolvimento,
    toqueDeAbertura: opcoes.toqueDeAbertura,
    pareamentoDoSensor: opcoes.pareamentoDoSensor,
    permitirNotificacao: opcoes.permitirNotificacao,
    janelaDeLembretes: opcoes.janelaDeLembretes,
    falharAoLerPreferencias: opcoes.falharAoLerPreferencias,
    falharAoGravarPreferencias: opcoes.falharAoGravarPreferencias,
    luz: opcoes.luz,
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
      'historico/[id]': RotaHistorico,
      sensor: RotaSensor,
      rendimento: RotaRendimento,
      lembretes: RotaLembretes,
      'editar/[id]/_layout': LayoutDaEdicao,
      'editar/[id]/index': RotaEditarAparencia,
      'editar/[id]/apelido': RotaEditarApelido,
    },
    { initialUrl: opcoes.url ?? '/' },
  );
  return { container, luz, relogio, plantas, regas, colheitas, notificador, avisos, toques, preferencias };
}

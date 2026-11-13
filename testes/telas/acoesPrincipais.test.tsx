import { act, fireEvent, screen } from 'expo-router/testing-library';
import { StyleSheet, ViewStyle } from 'react-native';
import {
  FalhaNoPareamento,
  PareamentoDoSensor,
  SensorEncontrado,
  SensorPareado,
} from '@/aplicacao/portas/PareamentoDoSensor';
import { ehVariantePrincipal } from '@/apresentacao/componentes/BotaoPrincipal';
import { DURACAO_DA_BUSCA_MS } from '@/apresentacao/telas/TelaParearSensor';
import { ALVO_DE_TOQUE_MINIMO } from '@/apresentacao/tema';
import { TEXTOS } from '@/textos';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

/**
 * US07 (#39): cada tela tem uma ação principal visualmente dominante, e todo alvo de toque tem pelo menos 44 × 44
 * pontos. "Dominante" é o botão preenchido e com sombra (elevação): o de contorno não compete com ele.
 */

const PAPEIS_TOCAVEIS = ['button', 'radio', 'checkbox', 'switch', 'tab', 'link'] as const;

function estiloDe(elemento: { props: { style?: unknown } }): ViewStyle {
  return (StyleSheet.flatten(elemento.props.style as ViewStyle) ?? {}) as ViewStyle;
}

function rotulo(elemento: { props: { accessibilityLabel?: string } }): string {
  return elemento.props.accessibilityLabel ?? '(sem rótulo)';
}

/** Os botões em destaque na tela: preenchidos e com sombra. */
function acoesDominantes(): string[] {
  return screen
    .queryAllByRole('button')
    .filter((botao) => (estiloDe(botao).elevation ?? 0) > 0)
    .map(rotulo);
}

/**
 * Os alvos com tamanho declarado abaixo do mínimo. Um alvo sem altura nem largura fixas cresce com o conteúdo, como
 * as linhas de texto largas: esses não entram, porque o tamanho deles não sai do estilo.
 */
function alvosPequenos(): string[] {
  return PAPEIS_TOCAVEIS.flatMap((papel) => screen.queryAllByRole(papel)).flatMap((alvo) => {
    const estilo = estiloDe(alvo);
    const medida = (fixa: unknown, minima: unknown) =>
      Math.max(typeof fixa === 'number' ? fixa : 0, typeof minima === 'number' ? minima : 0);
    const altura = medida(estilo.height, estilo.minHeight);
    const largura = medida(estilo.width, estilo.minWidth);
    const pequeno = (valor: number) => valor > 0 && valor < ALVO_DE_TOQUE_MINIMO;
    return pequeno(altura) || pequeno(largura) ? [`${rotulo(alvo)} (${largura || 'auto'} × ${altura || 'auto'})`] : [];
  });
}

function verificarTela(acaoPrincipal: string) {
  expect(acoesDominantes()).toEqual([acaoPrincipal]);
  expect(alvosPequenos()).toEqual([]);
}

/** Telas de consulta: o principal é o próprio controle (a busca, o horário, a lista), não um botão. */
function verificarTelaDeConsulta() {
  expect(acoesDominantes()).toEqual([]);
  expect(alvosPequenos()).toEqual([]);
}

const agora = new Date(2026, 10, 13, 10, 0);

class PareamentoFalso implements PareamentoDoSensor {
  pareado: SensorPareado | null = null;
  private aoFalhar: ((falha: FalhaNoPareamento) => void) | null = null;
  async pedirPermissoes() {
    return true;
  }
  procurar(_aoEncontrar: (sensor: SensorEncontrado) => void, aoFalhar: (falha: FalhaNoPareamento) => void) {
    this.aoFalhar = aoFalhar;
    return () => undefined;
  }
  async parear(): Promise<never> {
    throw new FalhaNoPareamento('fora-de-alcance');
  }
  async obterPareado() {
    return this.pareado;
  }
  async listarPareados() {
    return this.pareado ? [this.pareado] : [];
  }
  async esquecer() {
    this.pareado = null;
  }
  falhar(falha: FalhaNoPareamento) {
    act(() => this.aoFalhar?.(falha));
  }
}

describe('cada tela tem uma ação principal e alvos de pelo menos 44 pontos', () => {
  test('jardim vazio: começar a primeira planta', async () => {
    renderizarApp({ agora });
    await screen.findByRole('button', { name: TEXTOS.jardim.comecar });
    verificarTela(TEXTOS.jardim.comecar);
  });

  test('jardim com plantas: nova planta', async () => {
    renderizarApp({ plantas: [plantaDeTeste({ id: 'p1' })], agora });
    await screen.findByRole('button', { name: 'Nova planta' });
    verificarTela('Nova planta');
  });

  test('tela da planta: registrar a rega, mesmo numa frutífera, que também registra colheitas', async () => {
    renderizarApp({ plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'tomate' })], url: '/planta/p1', agora });
    await screen.findByRole('header', { name: 'Registrar colheita' });

    verificarTela('Registrar rega');
    // Excluir não pode chamar mais atenção que a ação principal: fica só com o contorno vermelho.
    expect(estiloDe(screen.getByRole('button', { name: 'Excluir' })).elevation ?? 0).toBe(0);
  });

  test('na confirmação de exclusão, excluir é a ação da caixa', async () => {
    renderizarApp({ plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'jiboia' })], url: '/planta/p1', agora });
    fireEvent.press(await screen.findByRole('button', { name: 'Excluir' }));

    expect(await screen.findByRole('button', { name: 'Excluir planta' })).toBeTruthy();
    expect(acoesDominantes()).toContain('Excluir planta');
  });

  test('cadastro: buscar a espécie, continuar e colocar na estante', async () => {
    renderizarApp({ url: '/cadastro', agora });
    await screen.findAllByTestId('resultado-especie');
    verificarTelaDeConsulta();

    fireEvent.press((await screen.findAllByTestId('resultado-especie'))[0]);
    await screen.findByRole('button', { name: 'Continuar' });
    verificarTela('Continuar');

    fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
    await screen.findByLabelText('Apelido da planta');
    expect(acoesDominantes()).toHaveLength(1);
    expect(alvosPequenos()).toEqual([]);
  });

  describe('ajustes', () => {
    test('sem Bluetooth no aparelho: mudar o horário dos lembretes', async () => {
      renderizarApp({ url: '/ajustes', agora });
      await screen.findByRole('button', { name: TEXTOS.lembretes.mudarHorario });
      verificarTela(TEXTOS.lembretes.mudarHorario);
    });

    test('sem sensor pareado: parear o sensor, e o horário fica secundário', async () => {
      renderizarApp({ url: '/ajustes', agora, pareamentoDoSensor: new PareamentoFalso() });
      await screen.findByRole('button', { name: 'Parear sensor' });
      verificarTela('Parear sensor');
    });

    test('com sensor pareado: o horário volta a ser o principal, e trocar o sensor fica secundário', async () => {
      const pareamento = new PareamentoFalso();
      pareamento.pareado = { id: 'AA:BB:CC:DD:9C:10', nome: 'FitoSfera' };
      renderizarApp({ url: '/ajustes', agora, pareamentoDoSensor: pareamento });
      await screen.findByRole('button', { name: TEXTOS.sensor.trocar });
      verificarTela(TEXTOS.lembretes.mudarHorario);
    });
  });

  describe('pareamento do sensor', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('sem nenhum sensor achado: procurar de novo', async () => {
      renderizarApp({ url: '/sensor', agora, pareamentoDoSensor: new PareamentoFalso() });
      await screen.findByText('Procurando sensores por perto…');
      await act(async () => {
        jest.advanceTimersByTime(DURACAO_DA_BUSCA_MS);
      });

      await screen.findByRole('button', { name: 'Procurar de novo' });
      verificarTela('Procurar de novo');
    });

    test('depois de uma falha: tentar de novo, com o atalho das configurações como secundário', async () => {
      const pareamento = new PareamentoFalso();
      renderizarApp({ url: '/sensor', agora, pareamentoDoSensor: pareamento });
      await screen.findByText('Procurando sensores por perto…');
      pareamento.falhar(new FalhaNoPareamento('bluetooth-desligado'));

      await screen.findByRole('button', { name: 'Tentar de novo' });
      verificarTela('Tentar de novo');
    });
  });

  test.each([
    ['horário dos lembretes', '/lembretes', '^Adiantar'],
    ['histórico de regas', '/historico/p1', null],
    ['comparar rendimento', '/rendimento', null],
  ])('%s é tela de consulta, sem botão disputando atenção', async (_tela, url, espera) => {
    renderizarApp({ plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'tomate' })], url, agora });
    if (espera) await screen.findAllByRole('button', { name: new RegExp(espera) });
    else await screen.findAllByRole('header');
    verificarTelaDeConsulta();
  });
});

test('só as variantes preenchidas contam como ação principal', () => {
  expect(ehVariantePrincipal('padrao')).toBe(true);
  expect(ehVariantePrincipal('rega')).toBe(true);
  expect(ehVariantePrincipal('perigo')).toBe(true);
  expect(ehVariantePrincipal('secundaria')).toBe(false);
  expect(ehVariantePrincipal('perigoDiscreto')).toBe(false);
});

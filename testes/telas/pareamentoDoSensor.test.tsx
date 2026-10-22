import { act, fireEvent, screen, waitFor } from 'expo-router/testing-library';
import {
  FalhaNoPareamento,
  PareamentoDoSensor,
  SensorEncontrado,
  SensorPareado,
} from '@/aplicacao/portas/PareamentoDoSensor';
import { Leitura } from '@/dominio/modelos/Leitura';
import { DURACAO_DA_BUSCA_MS } from '@/apresentacao/telas/TelaParearSensor';
import { renderizarApp } from './apoio/renderizarApp';

const LEITURA: Leitura = {
  temperaturaCelsius: 25.14,
  umidadePercentual: 58,
  luminosidadeLux: 1000,
  medidaEm: new Date(2026, 9, 22, 10, 0),
};

class PareamentoFalso implements PareamentoDoSensor {
  passos: string[] = [];
  permitir = true;
  pareado: SensorPareado | null = null;
  falharAoParear: FalhaNoPareamento | null = null;
  private aoEncontrar: ((sensor: SensorEncontrado) => void) | null = null;
  private aoFalhar: ((falha: FalhaNoPareamento) => void) | null = null;

  async pedirPermissoes() {
    this.passos.push('permissao');
    return this.permitir;
  }
  procurar(aoEncontrar: (sensor: SensorEncontrado) => void, aoFalhar: (falha: FalhaNoPareamento) => void) {
    this.passos.push('busca');
    this.aoEncontrar = aoEncontrar;
    this.aoFalhar = aoFalhar;
    return () => this.passos.push('fim-da-busca');
  }
  async parear(sensor: SensorPareado) {
    this.passos.push(`parear:${sensor.id}`);
    if (this.falharAoParear) throw this.falharAoParear;
    this.pareado = sensor;
    return LEITURA;
  }
  async obterPareado() {
    return this.pareado;
  }
  async esquecer() {
    this.pareado = null;
  }
  encontrar(sensor: SensorEncontrado) {
    act(() => this.aoEncontrar?.(sensor));
  }
  falhar(falha: FalhaNoPareamento) {
    act(() => this.aoFalhar?.(falha));
  }
}

describe('tela de pareamento', () => {
  test('pede as permissões antes de procurar', async () => {
    const pareamento = new PareamentoFalso();
    renderizarApp({ url: '/sensor', pareamentoDoSensor: pareamento });

    expect(await screen.findByText('Procurando sensores por perto…')).toBeTruthy();
    expect(pareamento.passos).toEqual(['permissao', 'busca']);
  });

  test('sem permissão, explica e não procura', async () => {
    const pareamento = new PareamentoFalso();
    pareamento.permitir = false;
    renderizarApp({ url: '/sensor', pareamentoDoSensor: pareamento });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sem a permissão de Bluetooth, o app não consegue procurar o sensor.',
    );
    expect(pareamento.passos).toEqual(['permissao']);
  });

  test('lista os sensores ao alcance, do sinal mais forte para o mais fraco', async () => {
    const pareamento = new PareamentoFalso();
    renderizarApp({ url: '/sensor', pareamentoDoSensor: pareamento });
    await screen.findByText('Procurando sensores por perto…');

    pareamento.encontrar({ id: 'AA:BB:CC:DD:00:01', nome: 'FitoSfera', intensidadeDoSinal: -85 });
    pareamento.encontrar({ id: 'AA:BB:CC:DD:9C:10', nome: 'FitoSfera', intensidadeDoSinal: -50 });

    const rotulos = screen
      .getAllByRole('button')
      .map((botao) => botao.props.accessibilityLabel)
      .filter((rotulo: string) => rotulo.startsWith('FitoSfera'));
    expect(rotulos).toEqual(['FitoSfera, final 9C10, sinal forte', 'FitoSfera, final 0001, sinal fraco']);
  });

  test('escolher um sensor conecta, mostra a primeira leitura e para a busca', async () => {
    const pareamento = new PareamentoFalso();
    renderizarApp({ url: '/sensor', pareamentoDoSensor: pareamento });
    await screen.findByText('Procurando sensores por perto…');
    pareamento.encontrar({ id: 'AA:BB:CC:DD:9C:10', nome: 'FitoSfera', intensidadeDoSinal: -50 });

    fireEvent.press(screen.getByRole('button', { name: 'FitoSfera, final 9C10, sinal forte' }));

    expect(await screen.findByText('✓ Sensor pareado')).toBeTruthy();
    expect(screen.getByText('Primeira leitura: 25,1 °C · 58% de umidade · 1000 lux.')).toBeTruthy();
    expect(pareamento.passos).toEqual(['permissao', 'busca', 'fim-da-busca', 'parear:AA:BB:CC:DD:9C:10']);
  });

  test('se o sensor não mandar leitura, explica e deixa tentar de novo', async () => {
    const pareamento = new PareamentoFalso();
    pareamento.falharAoParear = new FalhaNoPareamento('sem-leitura');
    renderizarApp({ url: '/sensor', pareamentoDoSensor: pareamento });
    await screen.findByText('Procurando sensores por perto…');
    pareamento.encontrar({ id: 'AA:BB:CC:DD:9C:10', nome: 'FitoSfera', intensidadeDoSinal: -50 });

    fireEvent.press(screen.getByRole('button', { name: 'FitoSfera, final 9C10, sinal forte' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/não mandou leitura/);
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy();
  });

  test('com o Bluetooth desligado, pede para ligar', async () => {
    const pareamento = new PareamentoFalso();
    renderizarApp({ url: '/sensor', pareamentoDoSensor: pareamento });
    await screen.findByText('Procurando sensores por perto…');

    pareamento.falhar(new FalhaNoPareamento('bluetooth-desligado'));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Bluetooth do celular está desligado/);
  });

  test('a busca termina sozinha e avisa quando não encontrou nada', async () => {
    jest.useFakeTimers();
    try {
      const pareamento = new PareamentoFalso();
      renderizarApp({ url: '/sensor', pareamentoDoSensor: pareamento });
      await screen.findByText('Procurando sensores por perto…');

      await act(() => jest.advanceTimersByTimeAsync(DURACAO_DA_BUSCA_MS));

      expect(screen.getByText(/Nenhum sensor encontrado/)).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Procurar de novo' })).toBeTruthy();
      expect(pareamento.passos).toContain('fim-da-busca');
    } finally {
      jest.useRealTimers();
    }
  });

  test('sem Bluetooth no app (Expo Go), explica que precisa do development build', async () => {
    renderizarApp({ url: '/sensor' });
    expect(await screen.findByText(/development build/)).toBeTruthy();
  });
});

describe('sensor nos ajustes', () => {
  test('sem sensor pareado, oferece parear e leva para a tela de pareamento', async () => {
    renderizarApp({ url: '/ajustes', pareamentoDoSensor: new PareamentoFalso() });

    expect(await screen.findByText(/Nenhum sensor pareado/)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Parear sensor' }));
    await waitFor(() => expect(screen).toHavePathname('/sensor'));
  });

  test('com sensor pareado, mostra qual é e permite esquecer', async () => {
    const pareamento = new PareamentoFalso();
    pareamento.pareado = { id: 'AA:BB:CC:DD:9C:10', nome: 'FitoSfera' };
    renderizarApp({ url: '/ajustes', pareamentoDoSensor: pareamento });

    expect(await screen.findByLabelText('Pareado com FitoSfera, final 9C10.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Trocar sensor' })).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Esquecer sensor' }));

    expect(await screen.findByText(/Nenhum sensor pareado/)).toBeTruthy();
    expect(pareamento.pareado).toBeNull();
  });
});

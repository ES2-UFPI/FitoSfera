import { act, fireEvent, screen } from 'expo-router/testing-library';
import { PareamentoDoSensor } from '@/aplicacao/portas/PareamentoDoSensor';
import { descreverUltimaComunicacao } from '@/apresentacao/componentes/IndicadorDeConexao';
import { plantaDeTeste, SensorFixo } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

const agora = new Date();
const minutosAtras = (minutos: number) => new Date(agora.getTime() - minutos * 60_000);
const horaEMinuto = (instante: Date) =>
  `${String(instante.getHours()).padStart(2, '0')}:${String(instante.getMinutes()).padStart(2, '0')}`;

function sensorConectado() {
  return new SensorFixo({
    umidadePercentual: 55,
    temperaturaCelsius: 24,
    luminosidadeLux: 12000,
    medidaEm: minutosAtras(1),
  });
}

describe('no detalhe da planta', () => {
  test('mostra que o sensor está conectado, junto das condições', async () => {
    renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', sensor: sensorConectado(), agora });
    expect(await screen.findByLabelText('Sensor conectado.')).toBeTruthy();
  });

  test('desconectar durante o uso muda o indicador, mostra a última comunicação e a tela continua respondendo', async () => {
    const sensor = sensorConectado();
    const { regas } = renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', sensor, agora });
    await screen.findByLabelText('Sensor conectado.');
    const ultimaComunicacao = minutosAtras(3);

    act(() => sensor.mudarConexao({ estado: 'desconectado', ultimaComunicacao }));

    expect(
      screen.getByLabelText(
        `Sensor desconectado. O app tenta reconectar sozinho. Última comunicação às ${horaEMinuto(ultimaComunicacao)}.`,
      ),
    ).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Condições agora' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Registrar rega' }));
    expect(await screen.findByText('✓ Rega registrada agora.')).toBeTruthy();
    expect(regas.salvas).toHaveLength(1);
  });

  test('acompanha a reconexão: conectando e, depois, conectado', async () => {
    const sensor = sensorConectado();
    renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', sensor, agora });
    await screen.findByLabelText('Sensor conectado.');

    act(() => sensor.mudarConexao({ estado: 'conectando', ultimaComunicacao: minutosAtras(3) }));
    expect(screen.getByLabelText('Conectando ao sensor…')).toBeTruthy();

    act(() => sensor.mudarConexao({ estado: 'conectado', ultimaComunicacao: agora }));
    expect(screen.getByLabelText('Sensor conectado.')).toBeTruthy();
  });

  test('sem permissão de Bluetooth, diz o que fazer', async () => {
    const sensor = sensorConectado();
    renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', sensor, agora });
    await screen.findByLabelText('Sensor conectado.');

    act(() => sensor.mudarConexao({ estado: 'sem-permissao', ultimaComunicacao: null }));

    expect(
      screen.getByLabelText('Sem permissão de Bluetooth. Permita o Bluetooth para o app voltar a receber leituras.'),
    ).toBeTruthy();
  });

  test('o indicador avisa o leitor de tela quando muda', async () => {
    renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', sensor: sensorConectado(), agora });
    expect(await screen.findByTestId('indicador-de-conexao')).toHaveProp('accessibilityLiveRegion', 'polite');
  });
});

test('na tela de pareamento, o indicador acompanha a conexão', async () => {
  const sensor = sensorConectado();
  const pareamento: PareamentoDoSensor = {
    pedirPermissoes: async () => true,
    procurar: () => () => undefined,
    parear: async () => {
      throw new Error('não usado');
    },
    obterPareado: async () => null,
    esquecer: async () => undefined,
  };
  renderizarApp({ url: '/sensor', sensor, pareamentoDoSensor: pareamento, agora });
  expect(await screen.findByLabelText('Sensor conectado.')).toBeTruthy();

  act(() => sensor.mudarConexao({ estado: 'desconectado', ultimaComunicacao: null }));

  expect(
    screen.getByLabelText('Sensor desconectado. O app tenta reconectar sozinho. Sem comunicação desde que o app abriu.'),
  ).toBeTruthy();
});

describe('motivo da desconexão e reconexão automática (#50)', () => {
  test('com o Bluetooth desligado, orienta a ligar e não promete horário de tentativa', async () => {
    const sensor = sensorConectado();
    renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', sensor, agora });
    await screen.findByLabelText('Sensor conectado.');

    act(() =>
      sensor.mudarConexao({ estado: 'desconectado', ultimaComunicacao: null, problema: 'bluetooth-desligado' }),
    );

    expect(
      screen.getByLabelText(
        'Sensor desconectado. O Bluetooth do celular está desligado. Ligue para o app voltar a receber leituras. ' +
          'Sem comunicação desde que o app abriu.',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Condições agora' })).toBeTruthy();
  });

  test('fora de alcance, explica e mostra quando o app vai tentar de novo', async () => {
    const sensor = sensorConectado();
    renderizarApp({ plantas: [plantaDeTeste()], url: '/planta/p1', sensor, agora });
    await screen.findByLabelText('Sensor conectado.');

    act(() =>
      sensor.mudarConexao({
        estado: 'desconectado',
        ultimaComunicacao: null,
        problema: 'fora-de-alcance',
        proximaTentativa: new Date(2026, 9, 24, 14, 5, 30),
      }),
    );

    expect(screen.getByText('O sensor está fora de alcance. Confira se ele está ligado e perto do celular.')).toBeTruthy();
    expect(screen.getByText('Nova tentativa automática às 14:05:30.')).toBeTruthy();
  });
});

describe('descreverUltimaComunicacao', () => {
  const referencia = new Date(2026, 9, 22, 15, 0);

  test('no mesmo dia, só a hora', () => {
    expect(descreverUltimaComunicacao(new Date(2026, 9, 22, 14, 5), referencia)).toBe('Última comunicação às 14:05');
  });

  test('em outro dia, a data e a hora', () => {
    expect(descreverUltimaComunicacao(new Date(2026, 9, 21, 9, 30), referencia)).toBe(
      'Última comunicação em 21/10/2026 às 09:30',
    );
  });

  test('sem nenhuma leitura, diz que não houve comunicação', () => {
    expect(descreverUltimaComunicacao(null, referencia)).toBe('Sem comunicação desde que o app abriu');
  });
});

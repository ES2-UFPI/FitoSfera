import { FalhaNoPareamento, SensorPareado } from '@/aplicacao/portas/PareamentoDoSensor';
import { ConexaoDoSensor } from '@/dominio/modelos/EstadoDaConexao';
import {
  ClienteBle,
  ConexaoBle,
  DispositivoBle,
  EstadoDoBluetooth,
  FalhaBle,
  TipoDaFalhaBle,
} from '@/infraestrutura/sensores/ClienteBle';
import {
  esperaParaReconectar,
  GuardaDoSensorPareado,
  SensorBluetooth,
} from '@/infraestrutura/sensores/SensorBluetooth';
import { RelogioParado } from '../apoio/fakes';

const NORMAL = '0gmoFugDAAA=';
const SEM_LUZ = '0gmoFv////8=';
const SENSOR: SensorPareado = { id: 'AA:BB:CC:DD:9C:10', nome: 'FitoSfera' };

class ConexaoFalsa implements ConexaoBle {
  valorLido: string | null = NORMAL;
  pedidos = 0;
  desconectada = false;
  responderAoPedido: string | null = null;
  private aoReceber: ((valor: string | null) => void) | null = null;
  private aviso: (() => void) | null = null;

  monitorar(aoReceber: (valor: string | null) => void) {
    this.aoReceber = aoReceber;
    return () => {
      this.aoReceber = null;
    };
  }
  async ler() {
    return this.valorLido;
  }
  async pedirLeitura() {
    this.pedidos++;
    if (this.responderAoPedido) this.notificar(this.responderAoPedido);
  }
  aoCair(aviso: () => void) {
    this.aviso = aviso;
    return () => {
      this.aviso = null;
    };
  }
  async desconectar() {
    this.desconectada = true;
  }
  notificar(valor: string) {
    this.aoReceber?.(valor);
  }
  cair() {
    this.aviso?.();
  }
}

class ClienteFalso implements ClienteBle {
  estado: EstadoDoBluetooth = 'ligado';
  permitir = true;
  falharAoConectar = false;
  tipoDaFalha: TipoDaFalhaBle = 'fora-de-alcance';
  tentativasDeConexao = 0;
  conexoes: ConexaoFalsa[] = [];
  proximaConexao = () => new ConexaoFalsa();
  buscaParada = false;
  private aoEncontrar: ((dispositivo: DispositivoBle) => void) | null = null;
  private aoFalharNaBusca: ((erro: FalhaBle) => void) | null = null;
  private aoMudarEstado: ((estado: EstadoDoBluetooth) => void) | null = null;

  temPermissao = true;
  async pedirPermissoes() {
    if (this.permitir) this.temPermissao = true;
    return this.permitir;
  }
  async temPermissoes() {
    return this.temPermissao;
  }
  async consultarEstado() {
    return this.estado;
  }
  observarEstado(aoMudar: (estado: EstadoDoBluetooth) => void) {
    this.aoMudarEstado = aoMudar;
    return () => {
      this.aoMudarEstado = null;
    };
  }
  procurar(aoEncontrar: (dispositivo: DispositivoBle) => void, aoFalhar: (erro: FalhaBle) => void) {
    this.aoEncontrar = aoEncontrar;
    this.aoFalharNaBusca = aoFalhar;
    return () => {
      this.buscaParada = true;
    };
  }
  async conectar() {
    this.tentativasDeConexao++;
    if (this.falharAoConectar) throw new FalhaBle(this.tipoDaFalha);
    const conexao = this.proximaConexao();
    this.conexoes.push(conexao);
    return conexao;
  }
  anunciar(dispositivo: DispositivoBle) {
    this.aoEncontrar?.(dispositivo);
  }
  falharNaBusca(tipo: TipoDaFalhaBle) {
    this.aoFalharNaBusca?.(new FalhaBle(tipo));
  }
  /** A pessoa liga ou desliga o Bluetooth do celular. */
  mudarEstado(estado: EstadoDoBluetooth) {
    this.estado = estado;
    this.aoMudarEstado?.(estado);
  }
  get ultima() {
    return this.conexoes[this.conexoes.length - 1];
  }
}

class GuardaEmMemoria implements GuardaDoSensorPareado {
  constructor(public sensor: SensorPareado | null = null) {}
  async obter() {
    return this.sensor;
  }
  async salvar(sensor: SensorPareado) {
    this.sensor = sensor;
  }
  async esquecer() {
    this.sensor = null;
  }
}

const instante = new Date(2026, 9, 22, 10, 0);

function montar(pareado: SensorPareado | null = null) {
  const cliente = new ClienteFalso();
  const guarda = new GuardaEmMemoria(pareado);
  const sensor = new SensorBluetooth(cliente, guarda, new RelogioParado(instante));
  return { cliente, guarda, sensor };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('reconexão ao sensor conhecido', () => {
  test('sem sensor pareado, fica indisponível e não conecta', async () => {
    const { cliente, sensor } = montar();
    expect(await sensor.lerLeituraAtual()).toBeNull();
    expect(await sensor.consultarEstadoDaConexao()).toBe('indisponivel');
    expect(cliente.conexoes).toHaveLength(0);
  });

  test('ao ser usado, conecta ao sensor guardado, lê, pede uma leitura fresca e carimba a hora de chegada', async () => {
    const { cliente, sensor } = montar(SENSOR);
    const aoReceber = jest.fn();
    sensor.observarLeituras(aoReceber);
    await jest.advanceTimersByTimeAsync(0);

    expect(await sensor.consultarEstadoDaConexao()).toBe('conectado');
    expect(cliente.ultima.pedidos).toBe(1);
    expect(await sensor.lerLeituraAtual()).toEqual({
      temperaturaCelsius: 25.14,
      umidadePercentual: 58,
      luminosidadeLux: 1000,
      medidaEm: instante,
    });

    cliente.ultima.notificar(SEM_LUZ);
    expect(aoReceber).toHaveBeenLastCalledWith(expect.objectContaining({ luminosidadeLux: null }));
    expect(aoReceber).toHaveBeenCalledTimes(2);
  });

  test('quando a ligação cai, fica desconectado e tenta de novo depois da espera', async () => {
    const { cliente, sensor } = montar(SENSOR);
    await sensor.lerLeituraAtual();
    await jest.advanceTimersByTimeAsync(0);

    cliente.ultima.cair();
    expect(await sensor.consultarEstadoDaConexao()).toBe('desconectado');

    await jest.advanceTimersByTimeAsync(esperaParaReconectar(0));
    expect(cliente.conexoes).toHaveLength(2);
    expect(await sensor.consultarEstadoDaConexao()).toBe('conectado');
  });

  test('se o sensor não estiver ao alcance, continua tentando', async () => {
    const { cliente, sensor } = montar(SENSOR);
    cliente.falharAoConectar = true;
    await sensor.lerLeituraAtual();
    await jest.advanceTimersByTimeAsync(0);
    expect(await sensor.consultarEstadoDaConexao()).toBe('desconectado');

    cliente.falharAoConectar = false;
    await jest.advanceTimersByTimeAsync(esperaParaReconectar(0));
    expect(await sensor.consultarEstadoDaConexao()).toBe('conectado');
  });
});

describe('busca', () => {
  test('avisa os sensores encontrados com nome e sinal, e para quando cancelada', async () => {
    const { cliente, sensor } = montar();
    const aoEncontrar = jest.fn();
    const cancelar = sensor.procurar(aoEncontrar, jest.fn());
    await jest.advanceTimersByTimeAsync(0);

    cliente.anunciar({ id: 'X1', nome: null, rssi: -55 });
    expect(aoEncontrar).toHaveBeenCalledWith({ id: 'X1', nome: 'FitoSfera', intensidadeDoSinal: -55 });

    cancelar();
    expect(cliente.buscaParada).toBe(true);
  });

  test('com o Bluetooth desligado, falha sem buscar', async () => {
    const { cliente, sensor } = montar();
    cliente.estado = 'desligado';
    const aoFalhar = jest.fn();
    sensor.procurar(jest.fn(), aoFalhar);
    await jest.advanceTimersByTimeAsync(0);

    expect(aoFalhar).toHaveBeenCalledWith(new FalhaNoPareamento('bluetooth-desligado'));
    expect(aoFalhar.mock.calls[0][0].motivo).toBe('bluetooth-desligado');
  });
});

describe('pareamento', () => {
  test('conecta, recebe a primeira leitura e só então guarda o sensor', async () => {
    const { guarda, sensor } = montar();
    const leitura = await sensor.parear(SENSOR);

    expect(leitura).toMatchObject({ temperaturaCelsius: 25.14, medidaEm: instante });
    expect(guarda.sensor).toEqual(SENSOR);
    expect(await sensor.obterPareado()).toEqual(SENSOR);
    expect(await sensor.consultarEstadoDaConexao()).toBe('conectado');
  });

  test('com a característica ainda vazia, espera a notificação pedida pelo comando', async () => {
    const { cliente, sensor } = montar();
    cliente.proximaConexao = () => {
      const conexao = new ConexaoFalsa();
      conexao.valorLido = null;
      conexao.responderAoPedido = NORMAL;
      return conexao;
    };
    await expect(sensor.parear(SENSOR)).resolves.toMatchObject({ luminosidadeLux: 1000 });
  });

  test('sem leitura no tempo limite, desconecta e não guarda o sensor', async () => {
    const { cliente, guarda, sensor } = montar();
    cliente.proximaConexao = () => {
      const conexao = new ConexaoFalsa();
      conexao.valorLido = null;
      return conexao;
    };
    const pareamento = sensor.parear(SENSOR);
    const resultado = expect(pareamento).rejects.toMatchObject({ motivo: 'sem-leitura' });
    await jest.advanceTimersByTimeAsync(20_000);
    await resultado;

    expect(cliente.ultima.desconectada).toBe(true);
    expect(guarda.sensor).toBeNull();
  });

  test('se não conectar, falha com o motivo e não guarda o sensor', async () => {
    const { cliente, guarda, sensor } = montar();
    cliente.falharAoConectar = true;
    await expect(sensor.parear(SENSOR)).rejects.toMatchObject({ motivo: 'fora-de-alcance' });
    expect(guarda.sensor).toBeNull();
  });

  test('trocar de sensor desconecta o anterior', async () => {
    const { cliente, guarda, sensor } = montar(SENSOR);
    await sensor.lerLeituraAtual();
    await jest.advanceTimersByTimeAsync(0);
    const anterior = cliente.ultima;

    const novo = { id: '11:22:33:44:55:66', nome: 'FitoSfera' };
    await sensor.parear(novo);

    expect(anterior.desconectada).toBe(true);
    expect(guarda.sensor).toEqual(novo);
  });

  test('esquecer desconecta, apaga o sensor guardado e volta a ficar indisponível', async () => {
    const { cliente, guarda, sensor } = montar(SENSOR);
    await sensor.lerLeituraAtual();
    await jest.advanceTimersByTimeAsync(0);

    await sensor.esquecer();

    expect(cliente.ultima.desconectada).toBe(true);
    expect(guarda.sensor).toBeNull();
    expect(await sensor.lerLeituraAtual()).toBeNull();
    expect(await sensor.consultarEstadoDaConexao()).toBe('indisponivel');
  });
});

describe('estado da conexão', () => {
  const estados = (aoMudar: jest.Mock) => aoMudar.mock.calls.map(([conexao]: [ConexaoDoSensor]) => conexao.estado);

  test('avisa na hora e a cada mudança: conectando e conectado', async () => {
    const { sensor } = montar(SENSOR);
    const aoMudar = jest.fn();
    sensor.observarConexao(aoMudar);
    await jest.advanceTimersByTimeAsync(0);

    expect(estados(aoMudar)).toEqual(['indisponivel', 'conectando', 'conectado']);
  });

  test('quando a ligação cai durante o uso, avisa "desconectado" com a hora da última comunicação', async () => {
    const { cliente, sensor } = montar(SENSOR);
    const aoMudar = jest.fn();
    sensor.observarConexao(aoMudar);
    await jest.advanceTimersByTimeAsync(0);

    cliente.ultima.cair();

    expect(aoMudar).toHaveBeenLastCalledWith({
      estado: 'desconectado',
      ultimaComunicacao: instante,
      problema: 'fora-de-alcance',
      proximaTentativa: new Date(instante.getTime() + esperaParaReconectar(0)),
    });
  });

  test('sem leitura nenhuma, a última comunicação é desconhecida', async () => {
    const { cliente, sensor } = montar(SENSOR);
    cliente.falharAoConectar = true;
    const aoMudar = jest.fn();
    sensor.observarConexao(aoMudar);
    await jest.advanceTimersByTimeAsync(0);

    expect(aoMudar).toHaveBeenLastCalledWith(
      expect.objectContaining({ estado: 'desconectado', ultimaComunicacao: null, problema: 'fora-de-alcance' }),
    );
  });

  test('sem permissão de Bluetooth, avisa "sem-permissao" e não tenta conectar', async () => {
    const { cliente, sensor } = montar(SENSOR);
    cliente.temPermissao = false;
    const aoMudar = jest.fn();
    sensor.observarConexao(aoMudar);
    await jest.advanceTimersByTimeAsync(0);

    expect([...new Set(estados(aoMudar))]).toEqual(['indisponivel', 'sem-permissao']);
    expect(cliente.conexoes).toHaveLength(0);
  });

  test('dar a permissão reconecta na hora, sem esperar a próxima tentativa', async () => {
    const { cliente, sensor } = montar(SENSOR);
    cliente.temPermissao = false;
    const aoMudar = jest.fn();
    sensor.observarConexao(aoMudar);
    await jest.advanceTimersByTimeAsync(0);

    await sensor.pedirPermissoes();
    await jest.advanceTimersByTimeAsync(0);

    expect(estados(aoMudar).slice(-2)).toEqual(['conectando', 'conectado']);
  });

  test('cancelar a observação para os avisos', async () => {
    const { cliente, sensor } = montar(SENSOR);
    const aoMudar = jest.fn();
    const cancelar = sensor.observarConexao(aoMudar);
    await jest.advanceTimersByTimeAsync(0);
    cancelar();
    const avisos = aoMudar.mock.calls.length;

    cliente.ultima.cair();

    expect(aoMudar).toHaveBeenCalledTimes(avisos);
  });
});

describe('falhas e reconexão automática (#50)', () => {
  test('a espera entre tentativas cresce em dobro até o teto de 60 s', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(esperaParaReconectar)).toEqual([
      5_000, 10_000, 20_000, 40_000, 60_000, 60_000, 60_000,
    ]);
  });

  test('com o sensor longe, tenta de novo esperando cada vez mais', async () => {
    const { cliente, sensor } = montar(SENSOR);
    cliente.falharAoConectar = true;
    await sensor.lerLeituraAtual();
    await jest.advanceTimersByTimeAsync(0);
    expect(cliente.tentativasDeConexao).toBe(1);

    await jest.advanceTimersByTimeAsync(5_000);
    expect(cliente.tentativasDeConexao).toBe(2);

    await jest.advanceTimersByTimeAsync(9_999);
    expect(cliente.tentativasDeConexao).toBe(2);
    await jest.advanceTimersByTimeAsync(1);
    expect(cliente.tentativasDeConexao).toBe(3);

    await jest.advanceTimersByTimeAsync(20_000);
    expect(cliente.tentativasDeConexao).toBe(4);
  });

  test('depois de reconectar, a espera volta ao começo na próxima queda', async () => {
    const { cliente, sensor } = montar(SENSOR);
    cliente.falharAoConectar = true;
    await sensor.lerLeituraAtual();
    await jest.advanceTimersByTimeAsync(0);
    await jest.advanceTimersByTimeAsync(5_000);
    cliente.falharAoConectar = false;
    await jest.advanceTimersByTimeAsync(10_000);
    expect(await sensor.consultarEstadoDaConexao()).toBe('conectado');

    cliente.ultima.cair();
    await jest.advanceTimersByTimeAsync(5_000);
    expect(await sensor.consultarEstadoDaConexao()).toBe('conectado');
  });

  test('avisa quando será a próxima tentativa e limpa o aviso ao reconectar', async () => {
    const { cliente, sensor } = montar(SENSOR);
    const aoMudar = jest.fn();
    sensor.observarConexao(aoMudar);
    await jest.advanceTimersByTimeAsync(0);

    cliente.ultima.cair();
    expect(aoMudar).toHaveBeenLastCalledWith(
      expect.objectContaining({ proximaTentativa: new Date(instante.getTime() + 5_000) }),
    );

    await jest.advanceTimersByTimeAsync(5_000);
    const ultima = aoMudar.mock.calls[aoMudar.mock.calls.length - 1][0] as ConexaoDoSensor;
    expect(ultima.estado).toBe('conectado');
    expect(ultima.proximaTentativa).toBeUndefined();
    expect(ultima.problema).toBeUndefined();
  });

  test('o tempo esgotado na conexão aparece como motivo da desconexão', async () => {
    const { cliente, sensor } = montar(SENSOR);
    cliente.falharAoConectar = true;
    cliente.tipoDaFalha = 'tempo-esgotado';
    const aoMudar = jest.fn();
    sensor.observarConexao(aoMudar);
    await jest.advanceTimersByTimeAsync(0);

    expect(aoMudar).toHaveBeenLastCalledWith(
      expect.objectContaining({ estado: 'desconectado', problema: 'tempo-esgotado' }),
    );
  });

  describe('Bluetooth desligado', () => {
    test('ao abrir com o Bluetooth desligado, avisa o motivo e não tenta conectar', async () => {
      const { cliente, sensor } = montar(SENSOR);
      cliente.estado = 'desligado';
      const aoMudar = jest.fn();
      sensor.observarConexao(aoMudar);
      await jest.advanceTimersByTimeAsync(0);

      expect(aoMudar).toHaveBeenLastCalledWith(
        expect.objectContaining({ estado: 'desconectado', problema: 'bluetooth-desligado' }),
      );
      expect(cliente.tentativasDeConexao).toBe(0);
    });

    test('ligar o Bluetooth reconecta na hora, sem esperar a tentativa agendada', async () => {
      const { cliente, sensor } = montar(SENSOR);
      cliente.estado = 'desligado';
      await sensor.lerLeituraAtual();
      await jest.advanceTimersByTimeAsync(0);

      cliente.mudarEstado('ligado');
      await jest.advanceTimersByTimeAsync(0);

      expect(await sensor.consultarEstadoDaConexao()).toBe('conectado');
    });

    test('desligar o Bluetooth durante o uso derruba a ligação e diz por quê', async () => {
      const { cliente, sensor } = montar(SENSOR);
      const aoMudar = jest.fn();
      sensor.observarConexao(aoMudar);
      await jest.advanceTimersByTimeAsync(0);

      cliente.estado = 'desligado';
      cliente.ultima.cair();
      await jest.advanceTimersByTimeAsync(0);

      expect(aoMudar).toHaveBeenLastCalledWith(
        expect.objectContaining({ estado: 'desconectado', problema: 'bluetooth-desligado' }),
      );
    });

    test('parear com o Bluetooth desligado falha com o motivo certo, sem tentar conectar', async () => {
      const { cliente, sensor } = montar();
      cliente.estado = 'desligado';

      await expect(sensor.parear(SENSOR)).rejects.toMatchObject({ motivo: 'bluetooth-desligado' });
      expect(cliente.tentativasDeConexao).toBe(0);
    });
  });

  test.each<[TipoDaFalhaBle, string]>([
    ['bluetooth-desligado', 'bluetooth-desligado'],
    ['sem-permissao', 'permissao-negada'],
    ['tempo-esgotado', 'tempo-esgotado'],
    ['fora-de-alcance', 'fora-de-alcance'],
    ['falha-na-leitura', 'falha-na-leitura'],
    ['desconhecido', 'falha-na-conexao'],
  ])('ao parear, a falha "%s" do Bluetooth vira o motivo "%s"', async (tipo, motivo) => {
    const { cliente, sensor } = montar();
    cliente.falharAoConectar = true;
    cliente.tipoDaFalha = tipo;
    await expect(sensor.parear(SENSOR)).rejects.toMatchObject({ motivo });
  });

  test.each<[TipoDaFalhaBle, string]>([
    ['sem-permissao', 'permissao-negada'],
    ['bluetooth-desligado', 'bluetooth-desligado'],
    ['desconhecido', 'falha-na-busca'],
  ])('na busca, a falha "%s" do Bluetooth vira o motivo "%s"', async (tipo, motivo) => {
    const { cliente, sensor } = montar();
    const aoFalhar = jest.fn();
    sensor.procurar(jest.fn(), aoFalhar);
    await jest.advanceTimersByTimeAsync(0);

    cliente.falharNaBusca(tipo);

    expect(aoFalhar.mock.calls[0][0].motivo).toBe(motivo);
  });
});

import { AvaliarLeitura, OpcoesDaAvaliacao } from '@/aplicacao/casos-de-uso/AvaliarLeitura';
import { FaixasRecomendadas } from '@/dominio/modelos/FaixaRecomendada';
import { JanelaDeLembretes } from '@/dominio/modelos/JanelaDeLembretes';
import { Leitura } from '@/dominio/modelos/Leitura';
import { LuzDoDia } from '@/dominio/regras/LuzDoDia';
import { VALIDADE_DA_LEITURA_MS } from '@/dominio/regras/StatusDaPlanta';
import {
  NotificadorFalso,
  plantaDeTeste,
  RegistroDeDesviosEmAbertoEmMemoria,
  RelogioParado,
  RepositorioDeAvisosEmMemoria,
  RepositorioDePlantasEmMemoria,
  RepositorioDePreferenciasEmMemoria,
  SensorFixo,
} from '../apoio/fakes';
import { FAIXAS_DE_TESTE } from '../apoio/especiesDeTeste';

/** Dia e noite com faixas diferentes: de dia 18–28 °C e 40–70%, à noite 13–23 °C e 40–80%. */
const FAIXAS: FaixasRecomendadas = {
  ...FAIXAS_DE_TESTE,
  temperaturaNoturna: { minimo: 13, maximo: 23 },
  umidadeDoArNoturna: { minimo: 40, maximo: 80 },
};

/** O dia inteiro liberado, para a janela de lembretes não esconder o que está sendo testado. */
const O_DIA_TODO: JanelaDeLembretes = { inicio: { hora: 0, minuto: 0 }, fim: { hora: 0, minuto: 0 } };

const hora = (horas: number, minutos = 0, dia = 12) => new Date(2026, 10, dia, horas, minutos);

function leitura(medidaEm: Date, parcial: Partial<Leitura> = {}): Leitura {
  return { umidadePercentual: 55, temperaturaCelsius: 23, luminosidadeLux: 12000, medidaEm, ...parcial };
}

/** Um jardim cujas verificações dividem a memória de avisos, como as execuções da tarefa de fundo. */
function jardim(opcoes: { janela?: JanelaDeLembretes; luz?: LuzDoDia | 'falha'; comTempoMinimo?: boolean } = {}) {
  const plantas = new RepositorioDePlantasEmMemoria([plantaDeTeste({ id: 'p1', faixasRecomendadas: FAIXAS })]);
  const notificador = new NotificadorFalso(true);
  const avisos = new RepositorioDeAvisosEmMemoria();
  const desviosEmAberto = new RegistroDeDesviosEmAbertoEmMemoria();
  const preferencias = new RepositorioDePreferenciasEmMemoria(opcoes.janela ?? O_DIA_TODO);
  const luz = opcoes.luz;
  const avaliacao: OpcoesDaAvaliacao = {
    desviosEmAberto: opcoes.comTempoMinimo === false ? undefined : desviosEmAberto,
    luzDoDia:
      luz === undefined
        ? undefined
        : {
            executar: async () => {
              if (luz === 'falha') throw new Error('sem registro de luz');
              return luz;
            },
          },
  };

  /** Uma verificação, por padrão no instante da leitura. */
  const verificar = (medida: Leitura, agora: Date = medida.medidaEm) =>
    new AvaliarLeitura(plantas, new SensorFixo(medida), notificador, avisos, new RelogioParado(agora),
      undefined, preferencias, avaliacao).executar();
  return { verificar, notificador, avisos, desviosEmAberto };
}

describe('faixas de dia e de noite', () => {
  test('um valor normal para a noite não gera aviso, mesmo depois do tempo mínimo', async () => {
    const { verificar, notificador } = jardim();
    const friaDaNoite = { temperaturaCelsius: 15, umidadePercentual: 76, luminosidadeLux: 0 };

    await verificar(leitura(hora(22), friaDaNoite));
    await verificar(leitura(hora(23), friaDaNoite));

    expect(notificador.entregues).toEqual([]);
  });

  test('o mesmo valor de dia está fora da faixa e avisa', async () => {
    const { verificar, notificador } = jardim();
    const fria = { temperaturaCelsius: 15 };

    await verificar(leitura(hora(10), fria));
    const entregues = await verificar(leitura(hora(10, 30), fria));

    expect(entregues).toHaveLength(1);
    expect(notificador.entregues[0].corpo).toBe('A temperatura está em 15 °C, abaixo do ideal.');
  });

  test('à noite, o que sai da faixa da noite continua avisando', async () => {
    const { verificar } = jardim();
    const quenteParaANoite = { temperaturaCelsius: 26, luminosidadeLux: 0 };

    await verificar(leitura(hora(22), quenteParaANoite));
    const entregues = await verificar(leitura(hora(22, 30), quenteParaANoite));

    expect(entregues.map((aviso) => aviso.titulo)).toEqual(['Tomatinho precisa sair do sol']);
  });

  test('escuro à noite não vira aviso de luz', async () => {
    const { verificar, notificador } = jardim();

    await verificar(leitura(hora(20), { luminosidadeLux: 0 }));
    await verificar(leitura(hora(21), { luminosidadeLux: 0 }));

    expect(notificador.entregues).toEqual([]);
  });
});

describe('tempo mínimo do desvio', () => {
  test('o desvio só avisa depois de durar o tempo mínimo', async () => {
    const { verificar } = jardim();
    const seca = { umidadePercentual: 30 };

    expect(await verificar(leitura(hora(14), seca))).toEqual([]);
    expect(await verificar(leitura(hora(14, 15), seca))).toEqual([]);
    expect(await verificar(leitura(hora(14, 30), seca))).toHaveLength(1);
  });

  test('uma oscilação que volta para a faixa antes do tempo mínimo não avisa', async () => {
    const { verificar, notificador, desviosEmAberto } = jardim();

    await verificar(leitura(hora(14), { umidadePercentual: 30 }));
    await verificar(leitura(hora(14, 15)));
    await verificar(leitura(hora(14, 30), { umidadePercentual: 30 }));

    expect(notificador.entregues).toEqual([]);
    // A contagem recomeçou na volta do desvio, às 14h30.
    expect(desviosEmAberto.salvos.get('p1')).toEqual(new Map([['umidadeDoAr:abaixo', hora(14, 30)]]));
  });

  test('depois de avisado, o mesmo desvio não avisa de novo', async () => {
    const { verificar } = jardim();
    const seca = { umidadePercentual: 30 };

    await verificar(leitura(hora(14), seca));
    await verificar(leitura(hora(14, 30), seca));

    expect(await verificar(leitura(hora(15), seca))).toEqual([]);
  });

  test('sem leitura nova, a contagem não se perde', async () => {
    const { verificar, desviosEmAberto } = jardim();

    await verificar(leitura(hora(14), { umidadePercentual: 30 }));
    // A mesma leitura, velha demais na verificação seguinte: não dá para saber se o desvio continuou.
    const muitoDepois = new Date(hora(14).getTime() + VALIDADE_DA_LEITURA_MS + 60_000);
    expect(await verificar(leitura(hora(14), { umidadePercentual: 30 }), muitoDepois)).toEqual([]);

    expect(desviosEmAberto.salvos.get('p1')).toEqual(new Map([['umidadeDoAr:abaixo', hora(14)]]));
  });
});

describe('aviso de falta de luz', () => {
  const FALTANDO: LuzDoDia = {
    dli: 4,
    conhecidaAte: hora(17),
    incompleta: false,
    progresso: 0.33,
    projecaoDli: 4.3,
    situacaoProjetada: 'abaixo',
  };

  test('perto do fim do dia, com a luz abaixo da meta, avisa', async () => {
    const { verificar } = jardim({ luz: FALTANDO });

    const entregues = await verificar(leitura(hora(17)));

    expect(entregues).toEqual([
      { idPlanta: 'p1', titulo: 'Tomatinho precisa de mais luz', corpo: 'Até agora, recebeu 33% da luz de que precisa hoje.' },
    ]);
  });

  test('antes das 17h não avisa, mesmo com a luz abaixo da meta', async () => {
    const { verificar, notificador } = jardim({ luz: FALTANDO });

    await verificar(leitura(hora(16, 45)));

    expect(notificador.entregues).toEqual([]);
  });

  test('nunca avisa num dia com leituras faltando', async () => {
    const { verificar, notificador } = jardim({ luz: { ...FALTANDO, incompleta: true } });

    await verificar(leitura(hora(18)));

    expect(notificador.entregues).toEqual([]);
  });

  test('com a luz dentro da meta, não avisa', async () => {
    const { verificar, notificador } = jardim({ luz: { ...FALTANDO, situacaoProjetada: 'ideal' } });

    await verificar(leitura(hora(18)));

    expect(notificador.entregues).toEqual([]);
  });

  test('avisa uma vez por dia, e volta a poder avisar no dia seguinte', async () => {
    const { verificar, notificador } = jardim({ luz: FALTANDO });

    await verificar(leitura(hora(17)));
    await verificar(leitura(hora(18)));
    expect(notificador.entregues).toHaveLength(1);

    await verificar(leitura(hora(9, 0, 13)));
    await verificar(leitura(hora(17, 0, 13)));
    expect(notificador.entregues).toHaveLength(2);
  });

  test('fora da janela de lembretes não avisa, e tenta de novo quando ela abrir no mesmo dia', async () => {
    const janela = { inicio: { hora: 18, minuto: 0 }, fim: { hora: 21, minuto: 0 } };
    const { verificar, notificador } = jardim({ luz: FALTANDO, janela });

    await verificar(leitura(hora(17)));
    expect(notificador.entregues).toEqual([]);

    await verificar(leitura(hora(18)));
    expect(notificador.entregues).toHaveLength(1);
  });

  test('falha ao calcular a luz não derruba a verificação dos desvios', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { verificar } = jardim({ luz: 'falha', comTempoMinimo: false });

    expect(await verificar(leitura(hora(17), { umidadePercentual: 30 }))).toHaveLength(1);
    aviso.mockRestore();
  });
});

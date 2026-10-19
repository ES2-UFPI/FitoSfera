import { AvaliarLeitura } from '@/aplicacao/casos-de-uso/AvaliarLeitura';
import { Leitura } from '@/dominio/modelos/Leitura';
import { Planta } from '@/dominio/modelos/Planta';
import { VALIDADE_DA_LEITURA_MS } from '@/dominio/regras/StatusDaPlanta';
import {
  NotificadorFalso,
  plantaDeTeste,
  RelogioParado,
  RepositorioDeAvisosEmMemoria,
  RepositorioDePlantasEmMemoria,
  SensorFixo,
} from '../apoio/fakes';

const AGORA = new Date(2026, 9, 17, 14, 0);

/** As faixas de `FAIXAS_DE_TESTE`: umidade 40–70%, temperatura 18–28 °C, luminosidade 5000–20000 lux. */
function leitura(parcial: Partial<Leitura> = {}): Leitura {
  return {
    umidadePercentual: 55,
    temperaturaCelsius: 23,
    luminosidadeLux: 12000,
    medidaEm: AGORA,
    ...parcial,
  };
}

function montar(
  opcoes: {
    plantas?: Planta[];
    leitura?: Leitura | null | 'falha';
    permitido?: boolean;
    falharAoNotificar?: boolean;
    avisadas?: ReadonlyMap<string, string>;
  } = {},
) {
  const plantas = new RepositorioDePlantasEmMemoria(opcoes.plantas ?? [plantaDeTeste({ id: 'p1' })]);
  const notificador = new NotificadorFalso(opcoes.permitido ?? true, opcoes.falharAoNotificar);
  const avisos = new RepositorioDeAvisosEmMemoria(opcoes.avisadas);
  const sensor = new SensorFixo(opcoes.leitura === undefined ? leitura() : opcoes.leitura);
  const caso = new AvaliarLeitura(plantas, sensor, notificador, avisos, new RelogioParado(AGORA));
  return { caso, notificador, avisos, plantas };
}

test('leitura fora da faixa gera notificação, com a planta e o que saiu da faixa', async () => {
  const { caso, notificador } = montar({ leitura: leitura({ temperaturaCelsius: 31 }) });

  const entregues = await caso.executar();

  expect(entregues).toEqual([
    {
      idPlanta: 'p1',
      titulo: 'Tomatinho precisa de atenção',
      corpo: 'A temperatura está em 31 °C, acima da faixa ideal (18 °C a 28 °C).',
    },
  ]);
  expect(notificador.entregues).toEqual(entregues);
});

test('leitura dentro da faixa não gera notificação', async () => {
  const { caso, notificador } = montar();

  expect(await caso.executar()).toEqual([]);
  expect(notificador.entregues).toEqual([]);
});

test('o mesmo desvio ainda não resolvido não gera notificação repetida', async () => {
  const { caso, notificador, avisos } = montar({ leitura: leitura({ temperaturaCelsius: 31 }) });

  await caso.executar();
  const repetida = await caso.executar();

  expect(repetida).toEqual([]);
  expect(notificador.entregues).toHaveLength(1);
  // A planta continua lembrada, senão o próximo desvio igual avisaria de novo.
  expect(avisos.salvas.get('p1')).toBe('temperatura:acima');
});

test('o desvio resolvido é esquecido, e o mesmo desvio mais tarde volta a avisar', async () => {
  const planta = plantaDeTeste({ id: 'p1' });
  const quente = new SensorFixo(leitura({ temperaturaCelsius: 31 }));
  const plantas = new RepositorioDePlantasEmMemoria([planta]);
  const notificador = new NotificadorFalso();
  const avisos = new RepositorioDeAvisosEmMemoria();
  const relogio = new RelogioParado(AGORA);

  await new AvaliarLeitura(plantas, quente, notificador, avisos, relogio).executar();
  await new AvaliarLeitura(plantas, new SensorFixo(leitura()), notificador, avisos, relogio).executar();
  expect(avisos.salvas.size).toBe(0);

  await new AvaliarLeitura(plantas, quente, notificador, avisos, relogio).executar();
  expect(notificador.entregues).toHaveLength(2);
});

test('uma grandeza a mais fora da faixa é um desvio novo e avisa de novo', async () => {
  const { caso: primeiro, notificador, avisos } = montar({ leitura: leitura({ temperaturaCelsius: 31 }) });
  await primeiro.executar();

  const { caso: segundo } = montar({
    leitura: leitura({ temperaturaCelsius: 31, umidadePercentual: 30 }),
    avisadas: avisos.salvas,
  });
  const entregues = await segundo.executar();

  expect(entregues).toHaveLength(1);
  expect(entregues[0].corpo).toBe(
    'A umidade do ar está em 30%, abaixo da faixa ideal (40% a 70%). ' +
      'A temperatura está em 31 °C, acima da faixa ideal (18 °C a 28 °C).',
  );
  expect(notificador.entregues).toHaveLength(1);
});

test('pede a permissão já na primeira execução, mesmo sem sensor configurado', async () => {
  const { caso, notificador } = montar({ leitura: null });

  expect(await caso.executar()).toEqual([]);
  expect(notificador.pedidosDePermissao).toBe(1);
});

test('sem permissão, não notifica nada', async () => {
  const { caso, notificador } = montar({ leitura: leitura({ temperaturaCelsius: 31 }), permitido: false });

  expect(await caso.executar()).toEqual([]);
  expect(notificador.entregues).toEqual([]);
});

test('leitura velha demais não diz nada sobre agora e não notifica', async () => {
  const velha = leitura({
    temperaturaCelsius: 31,
    medidaEm: new Date(AGORA.getTime() - VALIDADE_DA_LEITURA_MS - 1),
  });
  const { caso, notificador } = montar({ leitura: velha });

  expect(await caso.executar()).toEqual([]);
  expect(notificador.entregues).toEqual([]);
});

test('sensor fora do ar não derruba a verificação', async () => {
  const { caso, notificador } = montar({ leitura: 'falha' });

  expect(await caso.executar()).toEqual([]);
  expect(notificador.entregues).toEqual([]);
});

test('planta sem faixa recomendada nunca desvia', async () => {
  const { caso, notificador } = montar({
    plantas: [plantaDeTeste({ id: 'p1', faixasRecomendadas: null })],
    leitura: leitura({ temperaturaCelsius: 31 }),
  });

  expect(await caso.executar()).toEqual([]);
  expect(notificador.entregues).toEqual([]);
});

test('cada planta é avaliada com a sua própria faixa', async () => {
  const { caso, notificador } = montar({
    plantas: [
      plantaDeTeste({ id: 'p1', apelido: 'Tomatinho' }),
      plantaDeTeste({
        id: 'p2',
        apelido: 'Lavandinha',
        faixasRecomendadas: {
          umidadeDoAr: { minimo: 40, maximo: 70 },
          temperatura: { minimo: 18, maximo: 40 },
          luminosidade: { minimo: 5000, maximo: 20000 },
        },
      }),
    ],
    leitura: leitura({ temperaturaCelsius: 31 }),
  });

  await caso.executar();

  expect(notificador.entregues.map((aviso) => aviso.idPlanta)).toEqual(['p1']);
});

test('aviso que não chegou a ser entregue é tentado de novo na verificação seguinte', async () => {
  const quente = leitura({ temperaturaCelsius: 31 });
  const { caso: comFalha, avisos } = montar({ leitura: quente, falharAoNotificar: true });

  expect(await comFalha.executar()).toEqual([]);
  expect(avisos.salvas.size).toBe(0);

  const { caso, notificador } = montar({ leitura: quente, avisadas: avisos.salvas });
  expect(await caso.executar()).toHaveLength(1);
  expect(notificador.entregues).toHaveLength(1);
});

test('planta que saiu do jardim some da memória de avisos', async () => {
  const { caso, avisos } = montar({
    plantas: [plantaDeTeste({ id: 'p1' })],
    leitura: leitura({ temperaturaCelsius: 31 }),
    avisadas: new Map([['excluida', 'temperatura:acima']]),
  });

  await caso.executar();

  expect([...avisos.salvas.keys()]).toEqual(['p1']);
});

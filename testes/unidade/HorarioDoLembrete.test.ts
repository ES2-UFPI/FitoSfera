import { JANELA_PADRAO, JanelaDeLembretes } from '@/dominio/modelos/JanelaDeLembretes';
import { estaNaJanela, proximoHorarioPermitido } from '@/dominio/regras/HorarioDoLembrete';

const janela = (inicio: [number, number], fim: [number, number]): JanelaDeLembretes => ({
  inicio: { hora: inicio[0], minuto: inicio[1] },
  fim: { hora: fim[0], minuto: fim[1] },
});

/** 17/10/2026 às hh:mm, hora local. */
const em = (hora: number, minuto = 0) => new Date(2026, 9, 17, hora, minuto);

const DIURNA = janela([8, 0], [21, 0]);
const NOTURNA = janela([22, 0], [7, 0]);

describe('janela normal, dentro do mesmo dia', () => {
  test('o meio da janela está dentro, e a madrugada fora', () => {
    expect(estaNaJanela(DIURNA, em(14))).toBe(true);
    expect(estaNaJanela(DIURNA, em(3))).toBe(false);
    expect(estaNaJanela(DIURNA, em(23))).toBe(false);
  });

  test('os dois limites contam como dentro, como nas faixas recomendadas', () => {
    expect(estaNaJanela(DIURNA, em(8, 0))).toBe(true);
    expect(estaNaJanela(DIURNA, em(21, 0))).toBe(true);
  });

  test('um minuto fora de cada limite está fora', () => {
    expect(estaNaJanela(DIURNA, em(7, 59))).toBe(false);
    expect(estaNaJanela(DIURNA, em(21, 1))).toBe(false);
  });
});

describe('janela que atravessa a meia-noite', () => {
  test('vale dos dois lados da virada', () => {
    expect(estaNaJanela(NOTURNA, em(23))).toBe(true);
    expect(estaNaJanela(NOTURNA, em(0, 30))).toBe(true);
    expect(estaNaJanela(NOTURNA, em(6, 59))).toBe(true);
  });

  test('o meio do dia fica fora', () => {
    expect(estaNaJanela(NOTURNA, em(12))).toBe(false);
    expect(estaNaJanela(NOTURNA, em(21, 59))).toBe(false);
  });

  test('os limites contam como dentro nos dois lados', () => {
    expect(estaNaJanela(NOTURNA, em(22, 0))).toBe(true);
    expect(estaNaJanela(NOTURNA, em(7, 0))).toBe(true);
    expect(estaNaJanela(NOTURNA, em(7, 1))).toBe(false);
  });
});

describe('janela de início igual ao fim libera o dia inteiro', () => {
  test('qualquer hora está dentro', () => {
    const diaTodo = janela([0, 0], [0, 0]);
    for (const hora of [0, 3, 12, 18, 23]) expect(estaNaJanela(diaTodo, em(hora))).toBe(true);
  });

  test('vale para qualquer horário escolhido, não só a meia-noite', () => {
    expect(estaNaJanela(janela([9, 30], [9, 30]), em(4))).toBe(true);
  });
});

describe('o próximo horário permitido', () => {
  test('dentro da janela, é o próprio instante', () => {
    const agora = em(14, 20);
    expect(proximoHorarioPermitido(DIURNA, agora)).toBe(agora);
  });

  test('antes da abertura, é a abertura de hoje', () => {
    expect(proximoHorarioPermitido(DIURNA, em(3, 10))).toEqual(em(8, 0));
  });

  test('depois do fechamento, é a abertura de amanhã', () => {
    expect(proximoHorarioPermitido(DIURNA, em(22, 30))).toEqual(new Date(2026, 9, 18, 8, 0));
  });

  test('na janela noturna, o meio-dia espera as 22h do mesmo dia', () => {
    expect(proximoHorarioPermitido(NOTURNA, em(12))).toEqual(em(22, 0));
  });

  test('zera os segundos: a janela tem resolução de minuto', () => {
    const comSegundos = new Date(2026, 9, 17, 3, 10, 45, 500);
    const permitido = proximoHorarioPermitido(DIURNA, comSegundos);
    expect([permitido.getSeconds(), permitido.getMilliseconds()]).toEqual([0, 0]);
  });

  test('nunca devolve um instante no passado', () => {
    for (const hora of [0, 7, 8, 14, 21, 22, 23]) {
      const agora = em(hora, 30);
      expect(proximoHorarioPermitido(DIURNA, agora).getTime()).toBeGreaterThanOrEqual(agora.getTime());
      expect(proximoHorarioPermitido(NOTURNA, agora).getTime()).toBeGreaterThanOrEqual(agora.getTime());
    }
  });
});

test('a janela padrão vai das 8h às 21h e não cobre a madrugada', () => {
  expect(JANELA_PADRAO).toEqual({ inicio: { hora: 8, minuto: 0 }, fim: { hora: 21, minuto: 0 } });
  expect(estaNaJanela(JANELA_PADRAO, em(3))).toBe(false);
  expect(estaNaJanela(JANELA_PADRAO, em(10))).toBe(true);
});

import { calcularLuzRecebida, MarcaDoContadorDeLuz } from '@/dominio/regras/LuzRecebida';

const INICIO = new Date('2026-11-08T08:00:00.000Z');
const FIM = new Date('2026-11-08T18:00:00.000Z');
const MARCA: MarcaDoContadorDeLuz = { idReinicio: 7, luzAcumuladaLuxMinutos: 1_000, medidaEm: INICIO };

function contador(luzAcumuladaLuxMinutos: number, idReinicio = 7) {
  return { idReinicio, luzAcumuladaLuxMinutos, medidaEm: FIM };
}

test('o primeiro pacote só marca o ponto de partida: o que veio antes não é luz deste jardim', () => {
  expect(calcularLuzRecebida(null, contador(987_654))).toEqual({
    marca: contador(987_654),
    recebida: null,
  });
});

test('a luz acumulada durante o período sem conexão é a diferença entre os contadores', () => {
  expect(calcularLuzRecebida(MARCA, contador(4_000))).toEqual({
    marca: contador(4_000),
    recebida: { luxMinutos: 3_000, inicio: INICIO, fim: FIM, incompleta: false },
  });
});

test('o mesmo contador recebido de novo não gera luz, só avança a marca', () => {
  expect(calcularLuzRecebida(MARCA, contador(1_000))).toEqual({ marca: contador(1_000), recebida: null });
});

test('quando o contador do sensor dá a volta em 32 bits, a luz continua certa', () => {
  const quaseNoFim = { ...MARCA, luzAcumuladaLuxMinutos: 0xffffffff - 99 };
  const resultado = calcularLuzRecebida(quaseNoFim, contador(400));
  expect(resultado.recebida?.luxMinutos).toBe(500);
  expect(resultado.recebida?.incompleta).toBe(false);
});

test('um pacote atrasado, com contador menor, é ignorado em vez de parecer uma volta do contador', () => {
  expect(calcularLuzRecebida(MARCA, contador(900))).toEqual({ marca: MARCA, recebida: null });
});

test('depois de um reinício, não conta luz e marca o período como incompleto', () => {
  expect(calcularLuzRecebida(MARCA, contador(50, 8))).toEqual({
    marca: contador(50, 8),
    recebida: { luxMinutos: 0, inicio: INICIO, fim: FIM, incompleta: true },
  });
});

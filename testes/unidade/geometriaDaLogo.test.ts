import { CURVAS_DA_FOLHA, RAIOS_DOS_PONTOS, TRILHAS } from '@/apresentacao/abertura/geometriaDaLogo';

type Ponto = readonly [number, number];

// A borda da folha amostrada a partir das duas cúbicas, calculada aqui sem usar código do app.
function pontoDaCubica([p0, p1, p2, p3]: readonly Ponto[], t: number): Ponto {
  const u = 1 - t;
  return [0, 1].map(
    (i) => u ** 3 * p0[i] + 3 * u ** 2 * t * p1[i] + 3 * u * t ** 2 * p2[i] + t ** 3 * p3[i],
  ) as unknown as Ponto;
}
const borda: Ponto[] = CURVAS_DA_FOLHA.flatMap((curva) =>
  Array.from({ length: 401 }, (_, k) => pontoDaCubica(curva, k / 400)),
);

function dentro([x, y]: Ponto): boolean {
  let resultado = false;
  for (let i = 0, j = borda.length - 1; i < borda.length; j = i++) {
    const [xi, yi] = borda[i];
    const [xj, yj] = borda[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) resultado = !resultado;
  }
  return resultado;
}
const folgaAteABorda = ([x, y]: Ponto) => Math.min(...borda.map(([bx, by]) => Math.hypot(x - bx, y - by)));

// Meio traço do contorno (2,5) + meio traço da trilha (1,3): abaixo disso a trilha encosta no contorno.
const FOLGA_MINIMA = 3.8;

test('toda trilha fica dentro da folha, sem encostar no contorno', () => {
  TRILHAS.forEach((trilha) => {
    for (let s = 0; s < trilha.length - 1; s++) {
      const [a, b] = [trilha[s], trilha[s + 1]];
      for (let k = 0; k <= 20; k++) {
        const ponto: Ponto = [a[0] + ((b[0] - a[0]) * k) / 20, a[1] + ((b[1] - a[1]) * k) / 20];
        expect(dentro(ponto)).toBe(true);
        expect(folgaAteABorda(ponto)).toBeGreaterThanOrEqual(FOLGA_MINIMA);
      }
    }
  });
});

test('todo pontinho cabe inteiro dentro da folha', () => {
  TRILHAS.forEach((trilha, i) => {
    const ponta = trilha[trilha.length - 1];
    expect(dentro(ponta)).toBe(true);
    expect(folgaAteABorda(ponta) - RAIOS_DOS_PONTOS[i]).toBeGreaterThanOrEqual(FOLGA_MINIMA);
  });
});

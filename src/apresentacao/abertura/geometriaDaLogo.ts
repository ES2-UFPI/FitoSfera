/**
 * Geometria da logo do FitoSfera no espaço 200 × 200: caule triplo, base, duas folhas de circuito,
 * sol e gota. As trilhas de circuito ficam inteiras dentro das folhas (há um teste que garante isso).
 */
export type Ponto = readonly [number, number];
export type Cubica = readonly [Ponto, Ponto, Ponto, Ponto];

/** A folha, no espaço local dela: duas cúbicas da base (0, 0) até a ponta (70, −68) e de volta. */
export const CURVAS_DA_FOLHA: readonly Cubica[] = [
  [
    [0, 0],
    [10, -34],
    [40, -62],
    [70, -68],
  ],
  [
    [70, -68],
    [70, -34],
    [44, -6],
    [0, 0],
  ],
];

export const NERVURA: readonly Ponto[] = [
  [6, -6],
  [56, -54],
];

/** Saem da nervura e dobram em 45°, como numa placa de circuito. */
export const TRILHAS: readonly (readonly Ponto[])[] = [
  [
    [14.1, -14.1],
    [25.5, -14.1],
    [30.4, -19.1],
  ],
  [
    [21.2, -21.2],
    [21.2, -26.9],
    [29.7, -35.4],
  ],
  [
    [28.3, -28.3],
    [42.4, -28.3],
    [49.5, -35.4],
  ],
];
export const RAIOS_DOS_PONTOS = [3.2, 3, 3.2] as const;

/** Onde cada folha fica na logo: a direita como desenhada, a esquerda espelhada. */
export const FOLHA_DIREITA = 'translate(105 134)';
export const FOLHA_ESQUERDA = 'translate(95 126) scale(-1 1)';

export const CAULE_CENTRAL: readonly Ponto[] = [
  [100, 172],
  [100, 30],
];
export const CAULES_LATERAIS: readonly (readonly Ponto[])[] = [
  [
    [91, 172],
    [91, 60],
  ],
  [
    [109, 172],
    [109, 60],
  ],
];
export const BASE: Cubica = [
  [72, 178],
  [88, 164],
  [112, 164],
  [128, 178],
];
export const BOTAO = { centro: [100, 26] as Ponto, raio: 6 };

export const SOL = { centro: [158, 38] as Ponto, raio: 15, raioDosRaios: [24, 32] as const };
export const GOTA = {
  centro: [44, 154] as Ponto,
  contorno: 'M0 -30 C 16 -10, 22 0, 22 8 A 22 22 0 1 1 -22 8 C -22 0, -16 -10, 0 -30 Z',
  brilho: 'M-11 8 C -11 16, -6 21, 1 22',
};

export function caminhoDeLinha(pontos: readonly Ponto[]): string {
  return pontos.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
}

export function caminhoDeCubicas(curvas: readonly Cubica[]): string {
  const [[x0, y0]] = curvas[0];
  const trechos = curvas.map(([, c1, c2, fim]) => `C ${c1.join(' ')}, ${c2.join(' ')}, ${fim.join(' ')}`);
  return `M${x0} ${y0} ${trechos.join(' ')}`;
}

export function comprimentoDeLinha(pontos: readonly Ponto[]): number {
  let total = 0;
  for (let i = 1; i < pontos.length; i++) {
    total += Math.hypot(pontos[i][0] - pontos[i - 1][0], pontos[i][1] - pontos[i - 1][1]);
  }
  return total;
}

/** Comprimento aproximado de cúbicas, somando 64 segmentos por curva. Basta para o traço se desenhar. */
export function comprimentoDeCubicas(curvas: readonly Cubica[]): number {
  return curvas.reduce((total, [p0, p1, p2, p3]) => {
    const pontos = Array.from({ length: 65 }, (_, k): Ponto => {
      const t = k / 64;
      const u = 1 - t;
      const coordenada = (i: 0 | 1) =>
        u ** 3 * p0[i] + 3 * u ** 2 * t * p1[i] + 3 * u * t ** 2 * p2[i] + t ** 3 * p3[i];
      return [coordenada(0), coordenada(1)];
    });
    return total + comprimentoDeLinha(pontos);
  }, 0);
}

/** Uma medição do sensor do ambiente, com o momento em que foi feita. */
export interface Leitura {
  readonly umidadePercentual: number;
  readonly temperaturaCelsius: number;
  /** Null quando o sensor de luz não respondeu, mas temperatura e umidade chegaram. */
  readonly luminosidadeLux: number | null;
  readonly medidaEm: Date;
}

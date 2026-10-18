/** Uma medição do sensor do ambiente, com o momento em que foi feita. */
export interface Leitura {
  readonly umidadePercentual: number;
  readonly temperaturaCelsius: number;
  readonly luminosidadeLux: number;
  readonly medidaEm: Date;
}

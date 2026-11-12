/** O que o sensor físico informa sobre a luz somada desde que ligou, inclusive com o celular longe. */
export interface ContadorDeLuzDoSensor {
  /** Muda a cada vez que o sensor liga; junto com ele, o contador recomeça do zero. */
  readonly idReinicio: number;
  readonly luzAcumuladaLuxMinutos: number;
  readonly segundosSemConfirmacao: number;
  /** Data e hora da última confirmação do app, ou de quando o sensor ligou, se ainda não houve nenhuma. */
  readonly ultimaComunicacaoEm: Date;
}

/** Uma medição do sensor do ambiente, com o momento em que foi feita. */
export interface Leitura {
  readonly umidadePercentual: number;
  readonly temperaturaCelsius: number;
  /** Null quando o sensor de luz não respondeu, mas temperatura e umidade chegaram. */
  readonly luminosidadeLux: number | null;
  readonly medidaEm: Date;
  /** Ausente no sensor simulado e no pacote antigo de 8 bytes. */
  readonly contadorDeLuz?: ContadorDeLuzDoSensor;
}

/** Cada grandeza pode acompanhar a variação natural ou ser forçada independentemente. */
export type NivelDoSensorDeDesenvolvimento = 'automatico' | 'baixo' | 'alto';

export interface ConfiguracaoDoSensorDeDesenvolvimento {
  readonly umidade: NivelDoSensorDeDesenvolvimento;
  readonly temperatura: NivelDoSensorDeDesenvolvimento;
  readonly luminosidade: NivelDoSensorDeDesenvolvimento;
  readonly desconectado: boolean;
}

/** Controle separado da porta do sensor: um adaptador real não precisa conhecer cenários de teste. */
export interface ControleDoSensorDeDesenvolvimento {
  obterConfiguracao(idJardim?: string): ConfiguracaoDoSensorDeDesenvolvimento;
  definirConfiguracao(configuracao: ConfiguracaoDoSensorDeDesenvolvimento, idJardim?: string): void;
}

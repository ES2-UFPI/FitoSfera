/** Sol forte e constante, com que o simulador preenche a luz do dia. */
export const LUX_DO_SOL_FORTE = 40000;

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
  obterHorarioSimulado(idJardim?: string): Date;
  ajustarHorarioSimulado(deltaMs: number, idJardim?: string): Date;
  redefinirHorarioSimulado(idJardim?: string): Date;
  /**
   * Preenche a luz do dia do jardim com sol forte e constante, das 7h até agora no relógio da simulação. Devolve
   * false quando ainda não são 7h e não há o que preencher. Ausente no controle que não tem onde gravar a luz.
   */
  simularSolDesdeAs7h?(idJardim?: string): Promise<boolean>;
}

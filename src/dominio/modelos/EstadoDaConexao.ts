/**
 * Como está a ligação com o sensor do ambiente:
 * - `indisponivel`: o app não tem sensor configurado;
 * - `sem-permissao`: há sensor, mas a pessoa não permitiu o Bluetooth;
 * - `desconectado`: há sensor, mas sem ligação agora;
 * - `conectando`: tentando ligar;
 * - `conectado`: recebendo leituras.
 */
export type EstadoDaConexao = 'indisponivel' | 'sem-permissao' | 'desconectado' | 'conectando' | 'conectado';

/**
 * Por que o sensor está desconectado, quando dá para saber. Cada motivo pede uma ação diferente da pessoa:
 * - `bluetooth-desligado`: ligar o Bluetooth do celular;
 * - `fora-de-alcance`: aproximar o celular, conferir se o sensor está ligado e se outro celular não o ocupa;
 * - `tempo-esgotado`: o sensor demorou a responder;
 * - `falha-na-leitura`: conectou, mas o sensor não respondeu como deveria.
 */
export type ProblemaDaConexao = 'bluetooth-desligado' | 'fora-de-alcance' | 'tempo-esgotado' | 'falha-na-leitura';

export interface ConexaoDoSensor {
  readonly estado: EstadoDaConexao;
  /** Quando chegou a última leitura; null se nenhuma chegou desde que o app abriu. */
  readonly ultimaComunicacao: Date | null;
  /** Só aparece quando o estado é `desconectado` e o motivo é conhecido. */
  readonly problema?: ProblemaDaConexao;
  /** Quando o app vai tentar reconectar sozinho; só aparece enquanto há uma tentativa agendada. */
  readonly proximaTentativa?: Date;
}

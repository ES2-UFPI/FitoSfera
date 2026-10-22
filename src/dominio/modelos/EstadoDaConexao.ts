/**
 * Como está a ligação com o sensor do ambiente:
 * - `indisponivel`: o app não tem sensor configurado;
 * - `sem-permissao`: há sensor, mas a pessoa não permitiu o Bluetooth;
 * - `desconectado`: há sensor, mas sem ligação agora;
 * - `conectando`: tentando ligar;
 * - `conectado`: recebendo leituras.
 */
export type EstadoDaConexao = 'indisponivel' | 'sem-permissao' | 'desconectado' | 'conectando' | 'conectado';

export interface ConexaoDoSensor {
  readonly estado: EstadoDaConexao;
  /** Quando chegou a última leitura; null se nenhuma chegou desde que o app abriu. */
  readonly ultimaComunicacao: Date | null;
}

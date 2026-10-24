/** O contrato BLE do firmware em `firmware/` (README de lá). Mudar algo aqui exige mudar o firmware junto. */
export const CONTRATO_DO_SENSOR = {
  nome: 'FitoSfera',
  servico: 'f1705f3a-0001-4c7e-9a5b-3d0a6e2b9c10',
  leitura: 'f1705f3a-0002-4c7e-9a5b-3d0a6e2b9c10',
  comando: 'f1705f3a-0003-4c7e-9a5b-3d0a6e2b9c10',
  /** Qualquer byte no comando pede uma leitura na hora; `AQ==` é 0x01 em base64. */
  pedidoDeLeitura: 'AQ==',
  /** Com três tentativas do DHT11 a cada 5 s, uma resposta que demora mais que isto não vem mais. */
  tempoLimiteDaLeituraMs: 20_000,
} as const;

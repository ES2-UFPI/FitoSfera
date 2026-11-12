/** O contrato BLE do firmware em `firmware/` (README de lá). Mudar algo aqui exige mudar o firmware junto. */
export const CONTRATO_DO_SENSOR = {
  nome: 'FitoSfera',
  servico: 'f1705f3a-0001-4c7e-9a5b-3d0a6e2b9c10',
  leitura: 'f1705f3a-0002-4c7e-9a5b-3d0a6e2b9c10',
  comando: 'f1705f3a-0003-4c7e-9a5b-3d0a6e2b9c10',
  /** `0x01` pede leitura imediata; `0x02, sequência` confirma um pacote novo. */
  pedidoDeLeitura: 'AQ==',
  comandoDeConfirmacao: 0x02,
  /** O pacote automático novo é emitido a cada cinco minutos. */
  intervaloDeLeituraMs: 5 * 60_000,
  /** Idade tolerada para usar a leitura guardada sem provocar uma medição imediata. */
  idadeMaximaDaLeituraGuardadaMs: 2 * 5 * 60_000,
  /** Com três tentativas do DHT11 a cada 5 s, uma resposta que demora mais que isto não vem mais. */
  tempoLimiteDaLeituraMs: 20_000,
} as const;

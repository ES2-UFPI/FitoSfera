/**
 * Mapa de chaves do armazenamento local. Toda chave que o app lê ou grava sai daqui;
 * o README desta pasta descreve o formato de cada uma.
 */
export const VERSAO_ATUAL_DO_ARMAZENAMENTO = 2;

export const CHAVES = {
  /** Número da versão do schema em que os dados abaixo estão gravados. */
  versao: 'fitosfera:versao-do-schema',
  plantas: 'fitosfera:v2:plantas',
  /** Cópia de um conteúdo de `plantas` que não deu para ler, guardada antes de ser sobrescrito. */
  plantasIlegiveis: 'fitosfera:v2:plantas:ilegivel',
  /** Uma chave por planta, para gravar uma rega sem carregar as regas do jardim inteiro. */
  regasDaPlanta: (idPlanta: string) => `fitosfera:v2:regas:${idPlanta}`,
  /** Cópia de um conteúdo de `regasDaPlanta` que não deu para ler, guardada antes de ser sobrescrito. */
  regasIlegiveisDaPlanta: (idPlanta: string) => `fitosfera:v2:regas:${idPlanta}:ilegivel`,
  /** Assinatura do desvio já avisado de cada planta, para a notificação não se repetir. */
  avisos: 'fitosfera:v2:avisos',
  /** O sensor BLE escolhido na tela de pareamento: `{ id, nome }`. */
  sensorPareado: 'fitosfera:v2:sensor-pareado',
  /** Jardins, sensor associado e seleção ativa; ausente em instalações antigas. */
  jardins: 'fitosfera:v2:jardins',
  sensoresPareados: 'fitosfera:v2:sensores-pareados',
  /** Preferências de notificação: por enquanto, a janela de horários dos lembretes. */
  preferencias: 'fitosfera:v2:preferencias',
} as const;

/** Chaves da versão 1 (plantas sem faixas recomendadas). Só a migração lê; nada mais grava nelas. */
export const CHAVES_DA_VERSAO_1 = {
  plantas: 'fitosfera:v1:plantas',
  plantasIlegiveis: 'fitosfera:v1:plantas:ilegivel',
} as const;

/** Chaves da versão 0 (antes do versionamento). Só a migração lê; nada mais grava nelas. */
export const CHAVES_DA_VERSAO_0 = {
  plantas: '@fitosfera/plantas',
  plantasIlegiveis: '@fitosfera/plantas:ilegivel',
} as const;

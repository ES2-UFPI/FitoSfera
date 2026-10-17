/**
 * Mapa de chaves do armazenamento local. Toda chave que o app lê ou grava sai daqui;
 * o README desta pasta descreve o formato de cada uma.
 */
export const VERSAO_ATUAL_DO_ARMAZENAMENTO = 1;

export const CHAVES = {
  /** Número da versão do schema em que os dados abaixo estão gravados. */
  versao: 'fitosfera:versao-do-schema',
  plantas: 'fitosfera:v1:plantas',
  /** Cópia de um conteúdo de `plantas` que não deu para ler, guardada antes de ser sobrescrito. */
  plantasIlegiveis: 'fitosfera:v1:plantas:ilegivel',
} as const;

/** Chaves da versão 0 (antes do versionamento). Só a migração lê; nada mais grava nelas. */
export const CHAVES_DA_VERSAO_0 = {
  plantas: '@fitosfera/plantas',
  plantasIlegiveis: '@fitosfera/plantas:ilegivel',
} as const;

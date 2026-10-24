import { Leitura } from '@/dominio/modelos/Leitura';

export interface SensorEncontrado {
  readonly id: string;
  readonly nome: string;
  /** RSSI em dBm; quanto mais perto de zero, mais perto o sensor está. */
  readonly intensidadeDoSinal: number | null;
}

export interface SensorPareado {
  readonly id: string;
  readonly nome: string;
}

/**
 * Cada motivo vira uma mensagem própria na tela de pareamento. `falha-na-conexao` fica só para o que o
 * Bluetooth não soube explicar.
 */
export type MotivoDaFalhaDoPareamento =
  | 'permissao-negada'
  | 'bluetooth-desligado'
  | 'falha-na-busca'
  | 'fora-de-alcance'
  | 'tempo-esgotado'
  | 'falha-na-leitura'
  | 'falha-na-conexao'
  | 'sem-leitura';

export class FalhaNoPareamento extends Error {
  constructor(readonly motivo: MotivoDaFalhaDoPareamento) {
    super(`Falha no pareamento: ${motivo}.`);
    this.name = 'FalhaNoPareamento';
  }
}

/** O que a tela de pareamento precisa de um sensor real; o simulado e o indisponível não têm pareamento. */
export interface PareamentoDoSensor {
  /** Pede as permissões de Bluetooth (e de localização, em Android antigo) antes de qualquer busca. */
  pedirPermissoes(): Promise<boolean>;
  /** Busca sensores ao alcance até ser cancelada. Cada sensor é avisado de novo quando o sinal muda. */
  procurar(aoEncontrar: (sensor: SensorEncontrado) => void, aoFalhar: (falha: FalhaNoPareamento) => void): () => void;
  /** Conecta, espera a primeira leitura e, só então, guarda o sensor para reconectar sozinho depois. */
  parear(sensor: SensorPareado): Promise<Leitura>;
  obterPareado(): Promise<SensorPareado | null>;
  /** Quando há vários jardins, cada dispositivo continua pareado independentemente. */
  listarPareados?(): Promise<readonly SensorPareado[]>;
  esquecer(id?: string): Promise<void>;
}

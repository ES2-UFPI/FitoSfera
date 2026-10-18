import { EstadoDaConexao } from '../modelos/EstadoDaConexao';
import { Leitura } from '../modelos/Leitura';

/** Encerra uma observação de leituras. Chamar mais de uma vez não tem efeito. */
export type CancelarObservacao = () => void;

/**
 * O contrato que o domínio usa para obter leituras do ambiente. Sensor real, simulado ou nenhum: cada um é
 * um adaptador em `infraestrutura/`, e só `criarContainer.ts` decide qual entra.
 */
export interface SensorDeAmbiente {
  /** A leitura mais recente, ou null quando ainda não há nenhuma. */
  lerLeituraAtual(): Promise<Leitura | null>;
  /** Avisa cada leitura nova até a observação ser cancelada. */
  observarLeituras(aoReceber: (leitura: Leitura) => void): CancelarObservacao;
  consultarEstadoDaConexao(): Promise<EstadoDaConexao>;
}

import { ConexaoDoSensor, EstadoDaConexao } from '../modelos/EstadoDaConexao';
import { Leitura } from '../modelos/Leitura';

/** Encerra uma observação de leituras. Chamar mais de uma vez não tem efeito. */
export type CancelarObservacao = () => void;

/**
 * O contrato que o domínio usa para obter leituras do ambiente. Sensor real, simulado ou nenhum: cada um é
 * um adaptador em `infraestrutura/`, e só `criarContainer.ts` decide qual entra.
 */
export interface SensorDeAmbiente {
  /** A leitura mais recente, ou null quando ainda não há nenhuma. Responde na hora, sem esperar o sensor. */
  lerLeituraAtual(): Promise<Leitura | null>;
  /**
   * A leitura mais recente, se ainda for recente; senão, liga ao sensor se for preciso e espera a próxima, até
   * um tempo limite. Null quando nada chega. É para quem precisa de um valor e pode esperar alguns segundos,
   * como a verificação de avisos, que roda na abertura do app e em segundo plano, antes de haver leitura guardada.
   */
  aguardarLeitura(): Promise<Leitura | null>;
  /** Avisa cada leitura nova até a observação ser cancelada. */
  observarLeituras(aoReceber: (leitura: Leitura) => void): CancelarObservacao;
  consultarEstadoDaConexao(): Promise<EstadoDaConexao>;
  /** Avisa a situação da conexão na hora e a cada mudança, até a observação ser cancelada. */
  observarConexao(aoMudar: (conexao: ConexaoDoSensor) => void): CancelarObservacao;
}

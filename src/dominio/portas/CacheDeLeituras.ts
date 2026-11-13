import { Leitura } from '../modelos/Leitura';

/** Guarda a última medição recebida de cada jardim para consulta quando o sensor estiver indisponível. */
export interface CacheDeLeituras {
  obter(idJardim: string): Promise<Leitura | null>;
  /** Leituras ambientais históricas recentes do jardim, ordenadas da mais antiga para a mais nova. */
  obterHistorico(idJardim: string): Promise<readonly Leitura[]>;
  salvar(idJardim: string, leitura: Leitura): Promise<void>;
}

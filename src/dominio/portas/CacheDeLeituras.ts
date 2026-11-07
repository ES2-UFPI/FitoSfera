import { Leitura } from '../modelos/Leitura';

/** Guarda a última medição recebida de cada jardim para consulta quando o sensor estiver indisponível. */
export interface CacheDeLeituras {
  obter(idJardim: string): Promise<Leitura | null>;
  salvar(idJardim: string, leitura: Leitura): Promise<void>;
}

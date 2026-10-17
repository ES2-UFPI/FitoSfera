import { LeituraAmbiental } from '../modelos/LeituraAmbiental';

/** De onde vem a última medição do ambiente. Null quando ainda não há nenhuma. */
export interface FonteDeLeituras {
  ultimaLeitura(): Promise<LeituraAmbiental | null>;
}

import { LeituraAmbiental } from '@/dominio/modelos/LeituraAmbiental';
import { FonteDeLeituras } from '@/dominio/portas/FonteDeLeituras';

/**
 * Nesta versão ainda não há sensor: nunca existe leitura, e toda planta fica "sem dados".
 * Quando o hardware chegar, outro adaptador implementa a mesma porta em `criarContainer.ts`.
 */
export class FonteDeLeiturasIndisponivel implements FonteDeLeituras {
  async ultimaLeitura(): Promise<LeituraAmbiental | null> {
    return null;
  }
}

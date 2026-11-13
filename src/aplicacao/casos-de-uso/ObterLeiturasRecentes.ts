import { Leitura } from '@/dominio/modelos/Leitura';
import { CacheDeLeituras } from '@/dominio/portas/CacheDeLeituras';

/** Recupera as leituras guardadas de um jardim para regras que precisam de cobertura ambiental. */
export class ObterLeiturasRecentes {
  constructor(private readonly leituras: CacheDeLeituras) {}

  async executar(idJardim: string, desde: Date): Promise<readonly Leitura[]> {
    const historico = await this.leituras.obterHistorico(idJardim);
    return historico.filter((leitura) => leitura.medidaEm.getTime() >= desde.getTime());
  }
}

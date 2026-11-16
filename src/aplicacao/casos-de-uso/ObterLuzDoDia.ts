import { FaixaRecomendada } from '@/dominio/modelos/FaixaRecomendada';
import { Planta } from '@/dominio/modelos/Planta';
import { RegistroDeLuzRecebida } from '@/dominio/portas/RegistroDeLuzRecebida';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';
import { calcularLuzDoDia, LuzDoDia } from '@/dominio/regras/LuzDoDia';

/** Quanto da luz de hoje a planta já recebeu, pela luz que o sensor do jardim dela somou. */
export class ObterLuzDoDia {
  constructor(
    private readonly luz: Pick<RegistroDeLuzRecebida, 'listar' | 'obterUltimoContato'>,
    private readonly relogio: Relogio,
    private readonly especies: RepositorioDeEspecies,
  ) {}

  async executar(planta: Planta): Promise<LuzDoDia> {
    const [periodos, conhecidaAte, meta] = await Promise.all([
      this.luz.listar(planta.idJardim),
      this.luz.obterUltimoContato(planta.idJardim),
      this.meta(planta),
    ]);
    return calcularLuzDoDia({ periodos, conhecidaAte, meta, agora: this.relogio.agora() });
  }

  /**
   * A migração para a versão 4 já completa a meta das plantas antigas, mas uma planta pode ter ficado sem ela (a
   * espécie não estava no catálogo na hora). Aí vale a do catálogo, se a espécie aparecer lá.
   */
  private async meta(planta: Planta): Promise<FaixaRecomendada | null> {
    const daPlanta = planta.faixasRecomendadas?.luzDiaria;
    if (daPlanta) return daPlanta;
    const especie = await this.especies.obterPorId(planta.idEspecie);
    const doCatalogo = especie?.faixasIdeais?.luzDiaria;
    return doCatalogo ? { minimo: doCatalogo.minimo, maximo: doCatalogo.maximo } : null;
  }
}

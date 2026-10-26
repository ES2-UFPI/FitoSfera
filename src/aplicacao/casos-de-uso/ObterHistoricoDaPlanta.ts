import { Planta } from '@/dominio/modelos/Planta';
import { Rega } from '@/dominio/modelos/Rega';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';
import { RepositorioDeRegas } from '@/dominio/portas/RepositorioDeRegas';
import { SituacaoDaRega, situacaoDaRega } from '@/dominio/regras/ProximaRega';
import { diasDesde, diasNoJardim } from '@/dominio/regras/TempoNoJardim';

export const QUANTIDADE_DE_REGAS_RECENTES = 5;

export interface HistoricoDaPlanta {
  /** Null para plantas antigas, gravadas antes de o app registrar a data de cadastro. */
  readonly cadastradaEm: Date | null;
  readonly diasNoJardim: number | null;
  /** Null quando a planta ainda não foi regada. */
  readonly ultimaRega: Rega | null;
  /** Dias desde a última rega: 0 para hoje, 1 para ontem. Null quando não houve nenhuma. */
  readonly diasDesdeAUltimaRega: number | null;
  readonly regasRecentes: readonly Rega[];
  /** Quando regar de novo, contado da última rega — ou do cadastro, enquanto não houve nenhuma. */
  readonly proximaRega: SituacaoDaRega;
}

export class ObterHistoricoDaPlanta {
  constructor(
    private readonly regas: RepositorioDeRegas,
    private readonly relogio: Relogio,
    private readonly especies: RepositorioDeEspecies,
  ) {}

  async executar(planta: Planta): Promise<HistoricoDaPlanta> {
    const regas = await this.regas.listarPorPlanta(planta.id);
    const regasRecentes = regas.slice(0, QUANTIDADE_DE_REGAS_RECENTES);
    const ultimaRega = regasRecentes[0] ?? null;
    const agora = this.relogio.agora();
    const intervaloEmDias = await this.intervaloDeRega(planta);
    return {
      cadastradaEm: planta.cadastradaEm,
      diasNoJardim: diasNoJardim(planta.cadastradaEm, agora),
      ultimaRega,
      diasDesdeAUltimaRega: ultimaRega === null ? null : diasDesde(ultimaRega.regadaEm, agora),
      regasRecentes,
      proximaRega: situacaoDaRega({
        ultimaRegaEm: ultimaRega?.regadaEm ?? null,
        cadastradaEm: planta.cadastradaEm,
        intervaloEmDias,
        agora,
      }),
    };
  }

  /**
   * Planta cadastrada antes de o app guardar o intervalo não o tem: aí vale o da espécie no catálogo, que é de
   * onde ele teria sido copiado. Espécie fora do catálogo deixa o intervalo desconhecido, e o lembrete calado.
   */
  private async intervaloDeRega(planta: Planta): Promise<number | null> {
    if (planta.intervaloDeRegaEmDias !== null) return planta.intervaloDeRegaEmDias;
    const especie = await this.especies.obterPorId(planta.idEspecie);
    return especie?.intervaloDeRegaEmDias ?? null;
  }
}

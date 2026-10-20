import { Planta } from '@/dominio/modelos/Planta';
import { Rega } from '@/dominio/modelos/Rega';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeRegas } from '@/dominio/portas/RepositorioDeRegas';
import { diasNoJardim } from '@/dominio/regras/TempoNoJardim';

export const QUANTIDADE_DE_REGAS_RECENTES = 5;

export interface HistoricoDaPlanta {
  /** Null para plantas antigas, gravadas antes de o app registrar a data de cadastro. */
  readonly cadastradaEm: Date | null;
  readonly diasNoJardim: number | null;
  /** Null quando a planta ainda não foi regada. */
  readonly ultimaRega: Rega | null;
  readonly regasRecentes: readonly Rega[];
}

export class ObterHistoricoDaPlanta {
  constructor(
    private readonly regas: RepositorioDeRegas,
    private readonly relogio: Relogio,
  ) {}

  async executar(planta: Planta): Promise<HistoricoDaPlanta> {
    const regas = await this.regas.listarPorPlanta(planta.id);
    const regasRecentes = regas.slice(0, QUANTIDADE_DE_REGAS_RECENTES);
    return {
      cadastradaEm: planta.cadastradaEm,
      diasNoJardim: diasNoJardim(planta.cadastradaEm, this.relogio.agora()),
      ultimaRega: regasRecentes[0] ?? null,
      regasRecentes,
    };
  }
}

import { RepositorioDeColheitas } from '@/dominio/portas/RepositorioDeColheitas';
import { RepositorioDeRegas } from '@/dominio/portas/RepositorioDeRegas';

/**
 * Corrige o que foi lançado por engano: a rega tocada duas vezes, a colheita com a quantidade errada.
 * Apagar uma colheita não desfaz o "já está produzindo" da planta: a planta continua produzindo.
 */
export class ApagarRegistros {
  constructor(
    private readonly regas: Pick<RepositorioDeRegas, 'apagar'>,
    private readonly colheitas: Pick<RepositorioDeColheitas, 'apagar'>,
  ) {}

  apagarRega(idPlanta: string, idRega: string): Promise<void> {
    return this.regas.apagar(idPlanta, idRega);
  }

  apagarColheita(idPlanta: string, idColheita: string): Promise<void> {
    return this.colheitas.apagar(idPlanta, idColheita);
  }
}

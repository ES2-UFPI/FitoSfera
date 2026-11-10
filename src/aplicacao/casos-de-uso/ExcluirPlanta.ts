import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';
import { RepositorioDeRegas } from '@/dominio/portas/RepositorioDeRegas';
import { RegistroDeExclusoesPendentes } from '@/dominio/portas/RegistroDeExclusoesPendentes';
import { Notificador } from '@/dominio/portas/Notificador';

/** Remove a planta e, só depois, apaga suas regas para uma falha de remoção não destruir o histórico. */
export class ExcluirPlanta {
  constructor(
    private readonly plantas: RepositorioDePlantas,
    private readonly regas: RepositorioDeRegas,
    private readonly pendentes: RegistroDeExclusoesPendentes,
    private readonly notificador: Pick<Notificador, 'cancelarDaPlanta'>,
  ) {}

  async executar(idPlanta: string): Promise<void> {
    await this.notificador.cancelarDaPlanta(idPlanta);
    await this.pendentes.marcar(idPlanta);
    try {
      await this.plantas.remover(idPlanta);
    } catch (falha) {
      let aindaExiste: boolean;
      try {
        aindaExiste = await this.plantas.existe(idPlanta);
      } catch {
        throw falha;
      }
      if (aindaExiste) {
        try {
          await this.pendentes.remover(idPlanta);
        } catch (falhaAoLimpar) {
          console.warn('Não deu para limpar o marcador de exclusão da planta.', falhaAoLimpar);
        }
        throw falha;
      }
    }
    await this.regas.apagarDaPlanta(idPlanta);
    await this.pendentes.remover(idPlanta);
  }

  /** Termina limpezas interrompidas; regas só saem se a planta já não existe. */
  async recuperarPendentes(): Promise<void> {
    for (const idPlanta of await this.pendentes.listar()) {
      if (!(await this.plantas.existe(idPlanta))) await this.regas.apagarDaPlanta(idPlanta);
      await this.pendentes.remover(idPlanta);
    }
  }
}

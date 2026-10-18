import { Rega } from '@/dominio/modelos/Rega';
import { GeradorDeIdentificador } from '@/dominio/portas/GeradorDeIdentificador';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeRegas } from '@/dominio/portas/RepositorioDeRegas';

/** Registra o cuidado no instante atual e deixa a política de retenção a cargo do repositório. */
export class RegistrarRega {
  constructor(
    private readonly regas: RepositorioDeRegas,
    private readonly gerador: GeradorDeIdentificador,
    private readonly relogio: Relogio,
  ) {}

  async executar(idPlanta: string): Promise<Rega> {
    const rega: Rega = {
      id: this.gerador.gerar(),
      idPlanta,
      regadaEm: this.relogio.agora(),
    };
    await this.regas.gravar(rega);
    return rega;
  }
}

import { Rega } from '@/dominio/modelos/Rega';
import { GeradorDeIdentificador } from '@/dominio/portas/GeradorDeIdentificador';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeRegas } from '@/dominio/portas/RepositorioDeRegas';
import { DiaDoCalendario, diaDoCalendario, instanteDoDia } from '@/dominio/regras/DiaDoCalendario';

/** Cada motivo vira uma mensagem própria no campo da data. */
export class RegaInvalida extends Error {
  constructor(readonly motivo: 'data-invalida' | 'data-no-futuro') {
    super(`Rega inválida: ${motivo}.`);
    this.name = 'RegaInvalida';
  }
}

/**
 * Registra o cuidado e deixa a política de retenção a cargo do repositório. Sem dia, a rega é de agora; com um dia
 * passado (a pessoa esqueceu de registrar), vale a mesma regra da colheita: o meio-dia daquele dia.
 */
export class RegistrarRega {
  constructor(
    private readonly regas: RepositorioDeRegas,
    private readonly gerador: GeradorDeIdentificador,
    private readonly relogio: Relogio,
  ) {}

  /** O dia que o campo mostra preenchido: hoje. */
  hoje(): DiaDoCalendario {
    return diaDoCalendario(this.relogio.agora());
  }

  async executar(idPlanta: string, dia?: DiaDoCalendario | 'ilegivel'): Promise<Rega> {
    const regadaEm = instanteDoDia(dia, this.relogio.agora());
    if (regadaEm === 'data-invalida' || regadaEm === 'data-no-futuro') throw new RegaInvalida(regadaEm);
    const rega: Rega = { id: this.gerador.gerar(), idPlanta, regadaEm };
    await this.regas.gravar(rega);
    return rega;
  }
}

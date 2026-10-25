import { Aparencia } from './Aparencia';
import { FaixasRecomendadas } from './FaixaRecomendada';

export const LIMITE_DO_APELIDO = 30;
export const ID_JARDIM_PRINCIPAL = 'jardim-principal';

export class ApelidoInvalido extends Error {
  constructor() {
    super(`O apelido precisa ter entre 1 e ${LIMITE_DO_APELIDO} caracteres.`);
    this.name = 'ApelidoInvalido';
  }
}

/** Uma planta do jardim da pessoa: a espécie do catálogo, o apelido, como ela é desenhada e quando entrou. */
export class Planta {
  private constructor(
    readonly id: string,
    readonly idJardim: string,
    readonly idEspecie: string,
    readonly apelido: string,
    readonly aparencia: Aparencia,
    /** Null para plantas gravadas antes de o app registrar a data de cadastro. */
    readonly cadastradaEm: Date | null,
    /** Copiadas da espécie no cadastro; null quando a espécie não tinha faixa. */
    readonly faixasRecomendadas: FaixasRecomendadas | null,
    /** Copiado da espécie no cadastro; null em planta gravada antes de o app guardar o intervalo. */
    readonly intervaloDeRegaEmDias: number | null,
  ) {}

  static criar(dados: {
    id: string;
    idJardim?: string;
    idEspecie: string;
    apelido: string;
    aparencia: Aparencia;
    cadastradaEm?: Date | null;
    faixasRecomendadas?: FaixasRecomendadas | null;
    intervaloDeRegaEmDias?: number | null;
  }): Planta {
    const apelido = dados.apelido.trim();
    // Conta caracteres visíveis (code points): um emoji vale um, não dois.
    const tamanho = Array.from(apelido).length;
    if (tamanho === 0 || tamanho > LIMITE_DO_APELIDO) throw new ApelidoInvalido();
    return new Planta(
      dados.id,
      dados.idJardim ?? ID_JARDIM_PRINCIPAL,
      dados.idEspecie,
      apelido,
      dados.aparencia,
      dados.cadastradaEm ?? null,
      dados.faixasRecomendadas ?? null,
      dados.intervaloDeRegaEmDias ?? null,
    );
  }

  /** Espécie, data de cadastro, faixas e intervalo de rega não mudam na edição. */
  editar(alteracoes: { apelido: string; aparencia: Aparencia }): Planta {
    return Planta.criar({ ...this, ...alteracoes });
  }
}

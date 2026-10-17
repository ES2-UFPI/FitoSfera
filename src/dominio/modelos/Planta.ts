import { Aparencia } from './Aparencia';

export const LIMITE_DO_APELIDO = 30;

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
    readonly idEspecie: string,
    readonly apelido: string,
    readonly aparencia: Aparencia,
    /** Null para plantas gravadas antes de o app registrar a data de cadastro. */
    readonly cadastradaEm: Date | null,
  ) {}

  static criar(dados: {
    id: string;
    idEspecie: string;
    apelido: string;
    aparencia: Aparencia;
    cadastradaEm?: Date | null;
  }): Planta {
    const apelido = dados.apelido.trim();
    // Conta caracteres visíveis (code points): um emoji vale um, não dois.
    const tamanho = Array.from(apelido).length;
    if (tamanho === 0 || tamanho > LIMITE_DO_APELIDO) throw new ApelidoInvalido();
    return new Planta(dados.id, dados.idEspecie, apelido, dados.aparencia, dados.cadastradaEm ?? null);
  }
}

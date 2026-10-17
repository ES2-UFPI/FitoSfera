import { Aparencia } from './Aparencia';

export const LIMITE_DO_APELIDO = 30;

export class ApelidoInvalido extends Error {
  constructor() {
    super(`O apelido precisa ter entre 1 e ${LIMITE_DO_APELIDO} caracteres.`);
    this.name = 'ApelidoInvalido';
  }
}

/** Uma planta do jardim da pessoa: a espécie do catálogo, o apelido e como ela é desenhada. */
export class Planta {
  private constructor(
    readonly id: string,
    readonly idEspecie: string,
    readonly apelido: string,
    readonly aparencia: Aparencia,
  ) {}

  static criar(dados: { id: string; idEspecie: string; apelido: string; aparencia: Aparencia }): Planta {
    const apelido = dados.apelido.trim();
    // Conta caracteres visíveis (code points): um emoji vale um, não dois.
    const tamanho = Array.from(apelido).length;
    if (tamanho === 0 || tamanho > LIMITE_DO_APELIDO) throw new ApelidoInvalido();
    return new Planta(dados.id, dados.idEspecie, apelido, dados.aparencia);
  }
}

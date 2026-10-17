import { Aparencia } from '@/dominio/modelos/Aparencia';
import { Planta } from '@/dominio/modelos/Planta';
import { GeradorDeIdentificador } from '@/dominio/portas/GeradorDeIdentificador';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';

export class EspecieNaoEncontrada extends Error {
  constructor(idEspecie: string) {
    super(`A espécie "${idEspecie}" não está no catálogo.`);
    this.name = 'EspecieNaoEncontrada';
  }
}

/**
 * Grava no jardim a espécie escolhida na busca. Cada cadastro ganha um identificador novo, então a mesma
 * espécie cadastrada duas vezes vira duas plantas distintas.
 */
export class CadastrarPlanta {
  constructor(
    private readonly plantas: RepositorioDePlantas,
    private readonly especies: RepositorioDeEspecies,
    private readonly gerador: GeradorDeIdentificador,
    private readonly relogio: Relogio,
  ) {}

  async executar(pedido: { idEspecie: string; apelido: string; aparencia: Aparencia }): Promise<Planta> {
    if ((await this.especies.obterPorId(pedido.idEspecie)) === null) {
      throw new EspecieNaoEncontrada(pedido.idEspecie);
    }
    const planta = Planta.criar({ id: this.gerador.gerar(), cadastradaEm: this.relogio.agora(), ...pedido });
    await this.plantas.adicionar(planta);
    return planta;
  }
}

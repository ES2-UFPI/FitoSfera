import { AdicionarPlantaAoJardim } from '@/aplicacao/casos-de-uso/AdicionarPlantaAoJardim';
import { ListarJardimVirtual } from '@/aplicacao/casos-de-uso/ListarJardimVirtual';
import { ObterPlantaDoJardim } from '@/aplicacao/casos-de-uso/ObterPlantaDoJardim';
import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';
import { Container } from '@/composicao/Container';
import { Aparencia, APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { Planta } from '@/dominio/modelos/Planta';
import { GeradorDeIdentificador } from '@/dominio/portas/GeradorDeIdentificador';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';
import { RepositorioDeEspeciesLocal } from '@/infraestrutura/catalogo/RepositorioDeEspeciesLocal';
import { ESPECIES_DE_TESTE } from './especiesDeTeste';

export class RepositorioDePlantasEmMemoria implements RepositorioDePlantas {
  readonly salvas: Planta[];

  constructor(iniciais: Planta[] = []) {
    this.salvas = [...iniciais];
  }

  async listar() {
    return [...this.salvas];
  }

  async obterPorId(id: string) {
    return this.salvas.find((planta) => planta.id === id) ?? null;
  }

  async adicionar(planta: Planta) {
    this.salvas.push(planta);
  }
}

/** Simula o armazenamento do aparelho recusando a leitura. */
export class RepositorioQueFalhaAoLer extends RepositorioDePlantasEmMemoria {
  async listar(): Promise<Planta[]> {
    throw new Error('armazenamento indisponível');
  }

  async obterPorId(): Promise<Planta | null> {
    throw new Error('armazenamento indisponível');
  }
}

export class GeradorSequencial implements GeradorDeIdentificador {
  private proximo = 1;

  gerar() {
    return `p${this.proximo++}`;
  }
}

export function plantaDeTeste(
  parcial: Partial<{ id: string; idEspecie: string; apelido: string; aparencia: Aparencia }> = {},
): Planta {
  return Planta.criar({
    id: 'p1',
    idEspecie: 'tomate',
    apelido: 'Tomatinho',
    aparencia: APARENCIA_INICIAL,
    ...parcial,
  });
}

export function criarContainerDeTeste(
  opcoes: { plantas?: Planta[]; especies?: readonly EspecieVegetal[]; falharAoLer?: boolean } = {},
): {
  container: Container;
  plantas: RepositorioDePlantasEmMemoria;
} {
  const plantas = opcoes.falharAoLer
    ? new RepositorioQueFalhaAoLer(opcoes.plantas)
    : new RepositorioDePlantasEmMemoria(opcoes.plantas);
  const especies = new RepositorioDeEspeciesLocal(opcoes.especies ?? ESPECIES_DE_TESTE);
  const container: Container = {
    listarJardim: new ListarJardimVirtual(plantas, especies),
    obterPlanta: new ObterPlantaDoJardim(plantas, especies),
    pesquisarEspecies: new PesquisarEspecies(especies),
    adicionarPlanta: new AdicionarPlantaAoJardim(plantas, especies, new GeradorSequencial()),
  };
  return { container, plantas };
}

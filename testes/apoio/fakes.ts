import { CadastrarPlanta } from '@/aplicacao/casos-de-uso/CadastrarPlanta';
import { ListarJardimVirtual } from '@/aplicacao/casos-de-uso/ListarJardimVirtual';
import { ObterPlantaDoJardim } from '@/aplicacao/casos-de-uso/ObterPlantaDoJardim';
import { PesquisarEspecies } from '@/aplicacao/casos-de-uso/PesquisarEspecies';
import { Container } from '@/composicao/Container';
import { Aparencia, APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { LeituraAmbiental } from '@/dominio/modelos/LeituraAmbiental';
import { Planta } from '@/dominio/modelos/Planta';
import { FonteDeLeituras } from '@/dominio/portas/FonteDeLeituras';
import { GeradorDeIdentificador } from '@/dominio/portas/GeradorDeIdentificador';
import { Relogio } from '@/dominio/portas/Relogio';
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

/** Sensor de mentira: devolve a leitura combinada, nenhuma, ou falha. */
export class FonteDeLeiturasFixa implements FonteDeLeituras {
  constructor(private readonly leitura: LeituraAmbiental | null | 'falha' = null) {}

  async ultimaLeitura(): Promise<LeituraAmbiental | null> {
    if (this.leitura === 'falha') throw new Error('sensor fora do ar');
    return this.leitura;
  }
}

export class RelogioParado implements Relogio {
  constructor(private readonly instante: Date = new Date(2026, 9, 17, 14, 0)) {}

  agora(): Date {
    return this.instante;
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
  opcoes: {
    plantas?: Planta[];
    especies?: readonly EspecieVegetal[];
    falharAoLer?: boolean;
    leitura?: LeituraAmbiental | null | 'falha';
    agora?: Date;
  } = {},
): {
  container: Container;
  plantas: RepositorioDePlantasEmMemoria;
} {
  const plantas = opcoes.falharAoLer
    ? new RepositorioQueFalhaAoLer(opcoes.plantas)
    : new RepositorioDePlantasEmMemoria(opcoes.plantas);
  const especies = new RepositorioDeEspeciesLocal(opcoes.especies ?? ESPECIES_DE_TESTE);
  const leituras = new FonteDeLeiturasFixa(opcoes.leitura ?? null);
  const relogio = new RelogioParado(opcoes.agora);
  const container: Container = {
    listarJardim: new ListarJardimVirtual(plantas, especies, leituras, relogio),
    obterPlanta: new ObterPlantaDoJardim(plantas, especies, leituras, relogio),
    pesquisarEspecies: new PesquisarEspecies(especies),
    cadastrarPlanta: new CadastrarPlanta(plantas, especies, new GeradorSequencial(), relogio),
  };
  return { container, plantas };
}

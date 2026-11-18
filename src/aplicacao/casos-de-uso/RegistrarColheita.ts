import { ehUnidadeDeColheita, RegistroDeColheita, UnidadeDeColheita } from '@/dominio/modelos/RegistroDeColheita';
import { GeradorDeIdentificador } from '@/dominio/portas/GeradorDeIdentificador';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeColheitas } from '@/dominio/portas/RepositorioDeColheitas';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';

/** Um dia do calendário, como a pessoa escreve no formulário; o mês vai de 1 a 12. */
export interface DiaDoCalendario {
  readonly dia: number;
  readonly mes: number;
  readonly ano: number;
}

/** Cada motivo vira uma mensagem própria no formulário. */
export type MotivoDaColheitaInvalida =
  | 'quantidade-vazia'
  | 'quantidade-invalida'
  | 'unidades-fracionadas'
  | 'unidade-invalida'
  | 'data-invalida'
  | 'data-no-futuro'
  | 'data-antes-do-plantio'
  | 'planta-inexistente';

export class ColheitaInvalida extends Error {
  constructor(
    readonly motivo: MotivoDaColheitaInvalida,
    /** Só em 'data-antes-do-plantio': o plantio que a data furou, para a mensagem dizer qual é. */
    readonly plantadaEm: Date | null = null,
  ) {
    super(`Colheita inválida: ${motivo}.`);
    this.name = 'ColheitaInvalida';
  }
}

export interface PedidoDeColheita {
  readonly idPlanta: string;
  /** null quando o campo ficou vazio. */
  readonly quantidade: number | null;
  /** Texto, porque chega da interface: só vale uma das `UNIDADES_DE_COLHEITA`. */
  readonly unidade: string;
  /** Sem dia, a colheita é de agora; 'ilegivel' quando a data digitada não forma um dia. */
  readonly dia?: DiaDoCalendario | 'ilegivel';
}

/** Ao meio-dia, um dia passado não muda de data ao ser mostrado em outro fuso. */
const HORA_DE_UM_DIA_PASSADO = 12;

/**
 * Grava uma colheita da planta depois de validar a quantidade (maior que zero), a unidade e a data. Colhida hoje,
 * ela leva a hora de agora; num dia anterior, o meio-dia, já que a pessoa só informou o dia. Quem colhe já está
 * produzindo, então a planta passa a ser marcada assim (como a opção "já está produzindo" do cadastro).
 */
export class RegistrarColheita {
  constructor(
    private readonly colheitas: RepositorioDeColheitas,
    private readonly plantas: Pick<RepositorioDePlantas, 'existe' | 'obterPorId' | 'atualizar'>,
    private readonly gerador: GeradorDeIdentificador,
    private readonly relogio: Relogio,
  ) {}

  /** O dia que o formulário mostra preenchido: hoje. */
  hoje(): DiaDoCalendario {
    const agora = this.relogio.agora();
    return { dia: agora.getDate(), mes: agora.getMonth() + 1, ano: agora.getFullYear() };
  }

  async executar(pedido: PedidoDeColheita): Promise<RegistroDeColheita> {
    const unidade = validarUnidade(pedido.unidade);
    const quantidade = validarQuantidade(pedido.quantidade, unidade);
    const colhidaEm = this.validarData(pedido.dia);
    if (!(await this.plantas.existe(pedido.idPlanta))) throw new ColheitaInvalida('planta-inexistente');
    const plantadaEm = (await this.plantas.obterPorId(pedido.idPlanta))?.plantadaEm ?? null;
    // Compara só o dia: o plantio "hoje" é gravado com hora, e a colheita de um dia passado, ao meio-dia.
    if (plantadaEm !== null && inicioDoDia(colhidaEm) < inicioDoDia(plantadaEm))
      throw new ColheitaInvalida('data-antes-do-plantio', plantadaEm);

    const registro: RegistroDeColheita = {
      id: this.gerador.gerar(),
      idPlanta: pedido.idPlanta,
      quantidade,
      unidade,
      colhidaEm,
    };
    await this.colheitas.gravar(registro);
    await this.marcarComoProduzindo(pedido.idPlanta);
    return registro;
  }

  /**
   * A data da floração fica vazia: só a pessoa sabe quando a leva atual começou. Se a marcação falhar, a colheita
   * já foi gravada e continua valendo; avisar erro faria a pessoa registrar a mesma colheita de novo.
   */
  private async marcarComoProduzindo(idPlanta: string): Promise<void> {
    try {
      const planta = await this.plantas.obterPorId(idPlanta);
      if (planta === null || planta.colheitaIniciada) return;
      await this.plantas.atualizar(planta.marcarComoProduzindo());
    } catch (falha) {
      console.warn('A colheita foi gravada, mas não deu para marcar a planta como produzindo.', falha);
    }
  }

  private validarData(dia: PedidoDeColheita['dia']): Date {
    const colhidaEm = instanteDoDia(dia, this.relogio.agora());
    if (colhidaEm === 'data-invalida' || colhidaEm === 'data-no-futuro') throw new ColheitaInvalida(colhidaEm);
    return colhidaEm;
  }
}

/**
 * O instante que vai para o registro de um dia informado: hoje (ou sem dia) é agora; um dia passado, o meio-dia.
 * A colheita e a rega com data usam a mesma regra.
 */
export function instanteDoDia(
  dia: DiaDoCalendario | 'ilegivel' | undefined,
  agora: Date,
): Date | 'data-invalida' | 'data-no-futuro' {
  if (dia === undefined) return agora;
  if (dia === 'ilegivel' || !existeNoCalendario(dia)) return 'data-invalida';
  if (dia.dia === agora.getDate() && dia.mes === agora.getMonth() + 1 && dia.ano === agora.getFullYear()) return agora;
  const instante = new Date(dia.ano, dia.mes - 1, dia.dia, HORA_DE_UM_DIA_PASSADO);
  return instante.getTime() > agora.getTime() ? 'data-no-futuro' : instante;
}

function validarUnidade(unidade: string): UnidadeDeColheita {
  if (!ehUnidadeDeColheita(unidade)) throw new ColheitaInvalida('unidade-invalida');
  return unidade;
}

function validarQuantidade(quantidade: number | null, unidade: UnidadeDeColheita): number {
  if (quantidade === null) throw new ColheitaInvalida('quantidade-vazia');
  if (!Number.isFinite(quantidade) || quantidade <= 0) throw new ColheitaInvalida('quantidade-invalida');
  // Frutos se contam inteiros; gramas podem ter fração.
  if (unidade === 'unidades' && !Number.isInteger(quantidade)) throw new ColheitaInvalida('unidades-fracionadas');
  return quantidade;
}

function inicioDoDia(data: Date): number {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate()).getTime();
}

/** 31/02 ou 00/13 não existem: o Date "corrigiria" para outro dia, e a comparação pega isso. */
function existeNoCalendario({ dia, mes, ano }: DiaDoCalendario): boolean {
  if (![dia, mes, ano].every(Number.isInteger) || ano < 1000) return false;
  const data = new Date(ano, mes - 1, dia);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
}

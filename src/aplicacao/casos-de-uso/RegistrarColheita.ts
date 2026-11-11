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
  | 'planta-inexistente';

export class ColheitaInvalida extends Error {
  constructor(readonly motivo: MotivoDaColheitaInvalida) {
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
 * ela leva a hora de agora; num dia anterior, o meio-dia, já que a pessoa só informou o dia.
 */
export class RegistrarColheita {
  constructor(
    private readonly colheitas: RepositorioDeColheitas,
    private readonly plantas: Pick<RepositorioDePlantas, 'existe'>,
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

    const registro: RegistroDeColheita = {
      id: this.gerador.gerar(),
      idPlanta: pedido.idPlanta,
      quantidade,
      unidade,
      colhidaEm,
    };
    await this.colheitas.gravar(registro);
    return registro;
  }

  private validarData(dia: PedidoDeColheita['dia']): Date {
    const agora = this.relogio.agora();
    if (dia === undefined) return agora;
    if (dia === 'ilegivel' || !existeNoCalendario(dia)) throw new ColheitaInvalida('data-invalida');
    const hoje = this.hoje();
    if (dia.dia === hoje.dia && dia.mes === hoje.mes && dia.ano === hoje.ano) return agora;
    const colhidaEm = new Date(dia.ano, dia.mes - 1, dia.dia, HORA_DE_UM_DIA_PASSADO);
    if (colhidaEm.getTime() > agora.getTime()) throw new ColheitaInvalida('data-no-futuro');
    return colhidaEm;
  }
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

/** 31/02 ou 00/13 não existem: o Date "corrigiria" para outro dia, e a comparação pega isso. */
function existeNoCalendario({ dia, mes, ano }: DiaDoCalendario): boolean {
  if (![dia, mes, ano].every(Number.isInteger) || ano < 1000) return false;
  const data = new Date(ano, mes - 1, dia);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia;
}

import { Leitura } from '@/dominio/modelos/Leitura';
import { RegistroDeLuzRecebida } from '@/dominio/portas/RegistroDeLuzRecebida';
import { calcularLuzRecebida, MarcaDoContadorDeLuz, PeriodoDeLuz } from '@/dominio/regras/LuzRecebida';
import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES } from './chaves';

/** Com o sensor publicando a cada 5 min, cobre mais de um dia e meio de períodos com luz. */
export const LIMITE_DE_PERIODOS_DE_LUZ = 500;

interface EstadoDaLuz {
  readonly marca: MarcaDoContadorDeLuz | null;
  readonly periodos: readonly PeriodoDeLuz[];
}

const SEM_REGISTRO: EstadoDaLuz = { marca: null, periodos: [] };

/**
 * Guarda num objeto JSON por jardim o último contador contabilizado e os períodos de luz. Sem a marca salva, a luz
 * somada com o app fechado não teria com o que ser comparada. Conteúdo ilegível recomeça a contagem: o próximo
 * contador vira o ponto de partida, sem inventar luz.
 */
export class RegistroDeLuzRecebidaAsyncStorage implements RegistroDeLuzRecebida {
  private readonly filas = new Map<string, Promise<void>>();

  constructor(private readonly armazenamento: ArmazenamentoChaveValor) {}

  /** A mesma leitura chega por caminhos diferentes ao mesmo tempo; a fila impede que duas a comparem com a mesma marca. */
  registrar(idJardim: string, leitura: Leitura): Promise<void> {
    if (leitura.contadorDeLuz === undefined) return Promise.resolve();
    const contagem = (this.filas.get(idJardim) ?? Promise.resolve())
      .catch(() => undefined)
      .then(() => this.contabilizar(idJardim, leitura));
    this.filas.set(idJardim, contagem);
    return contagem;
  }

  async listar(idJardim: string): Promise<readonly PeriodoDeLuz[]> {
    return (await this.ler(idJardim)).periodos;
  }

  async obterUltimoContato(idJardim: string): Promise<Date | null> {
    return (await this.ler(idJardim)).marca?.medidaEm ?? null;
  }

  private async contabilizar(idJardim: string, leitura: Leitura): Promise<void> {
    const contador = leitura.contadorDeLuz;
    if (contador === undefined) return;
    const estado = await this.ler(idJardim);
    const { marca, recebida } = calcularLuzRecebida(estado.marca, {
      idReinicio: contador.idReinicio,
      luzAcumuladaLuxMinutos: contador.luzAcumuladaLuxMinutos,
      medidaEm: leitura.medidaEm,
    });
    if (marca === estado.marca) return;
    const periodos = recebida === null ? estado.periodos : [...estado.periodos, recebida].slice(-LIMITE_DE_PERIODOS_DE_LUZ);
    await this.armazenamento.setItem(CHAVES.luzDoJardim(idJardim), JSON.stringify({ marca, periodos }));
  }

  private async ler(idJardim: string): Promise<EstadoDaLuz> {
    const bruto = await this.armazenamento.getItem(CHAVES.luzDoJardim(idJardim));
    if (bruto === null) return SEM_REGISTRO;
    try {
      const valor: unknown = JSON.parse(bruto);
      if (!ehRegistro(valor) || !Array.isArray(valor.periodos)) return SEM_REGISTRO;
      return {
        marca: lerMarca(valor.marca),
        periodos: valor.periodos.map(lerPeriodo).filter((periodo) => periodo !== null),
      };
    } catch {
      return SEM_REGISTRO;
    }
  }
}

function lerMarca(valor: unknown): MarcaDoContadorDeLuz | null {
  if (!ehRegistro(valor)) return null;
  const medidaEm = lerData(valor.medidaEm);
  if (medidaEm === null || typeof valor.idReinicio !== 'number' || typeof valor.luzAcumuladaLuxMinutos !== 'number')
    return null;
  return { idReinicio: valor.idReinicio, luzAcumuladaLuxMinutos: valor.luzAcumuladaLuxMinutos, medidaEm };
}

function lerPeriodo(valor: unknown): PeriodoDeLuz | null {
  if (!ehRegistro(valor)) return null;
  const inicio = lerData(valor.inicio);
  const fim = lerData(valor.fim);
  if (inicio === null || fim === null || typeof valor.luxMinutos !== 'number' || typeof valor.incompleta !== 'boolean')
    return null;
  return { luxMinutos: valor.luxMinutos, inicio, fim, incompleta: valor.incompleta };
}

function lerData(valor: unknown): Date | null {
  if (typeof valor !== 'string') return null;
  const data = new Date(valor);
  return Number.isFinite(data.getTime()) ? data : null;
}

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

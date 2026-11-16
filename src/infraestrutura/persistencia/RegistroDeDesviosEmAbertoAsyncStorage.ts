import { RegistroDeDesviosEmAberto } from '@/dominio/portas/RegistroDeDesviosEmAberto';
import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES } from './chaves';

type Registro = Record<string, unknown>;

const ehRegistro = (valor: unknown): valor is Registro =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor);

/**
 * Guarda num objeto JSON (`fitosfera:v4:desvios-em-aberto`) desde quando cada desvio de cada planta vem aparecendo,
 * com a data em ISO. Como em `avisos`, conteúdo ilegível é lido como vazio e sobrescrito na próxima gravação, sem
 * cópia `:ilegivel`: o pior que acontece é um desvio esperar o tempo mínimo de novo.
 */
export class RegistroDeDesviosEmAbertoAsyncStorage implements RegistroDeDesviosEmAberto {
  constructor(private readonly armazenamento: ArmazenamentoChaveValor) {}

  async listar(): Promise<ReadonlyMap<string, ReadonlyMap<string, Date>>> {
    const bruto = await this.armazenamento.getItem(CHAVES.desviosEmAberto);
    if (bruto === null) return new Map();
    try {
      const conteudo: unknown = JSON.parse(bruto);
      if (!ehRegistro(conteudo)) return new Map();
      const plantas = new Map<string, ReadonlyMap<string, Date>>();
      for (const [idPlanta, desvios] of Object.entries(conteudo)) {
        if (!ehRegistro(desvios)) continue;
        const vistos = new Map<string, Date>();
        for (const [chave, desde] of Object.entries(desvios)) {
          const data = typeof desde === 'string' ? new Date(desde) : null;
          if (data !== null && !Number.isNaN(data.getTime())) vistos.set(chave, data);
        }
        if (vistos.size > 0) plantas.set(idPlanta, vistos);
      }
      return plantas;
    } catch {
      return new Map();
    }
  }

  async gravar(desvios: ReadonlyMap<string, ReadonlyMap<string, Date>>): Promise<void> {
    const conteudo = Object.fromEntries(
      [...desvios]
        .filter(([, vistos]) => vistos.size > 0)
        .map(([idPlanta, vistos]) => [idPlanta, Object.fromEntries([...vistos].map(([chave, desde]) => [chave, desde.toISOString()]))]),
    );
    if (Object.keys(conteudo).length === 0) {
      await this.armazenamento.removeItem(CHAVES.desviosEmAberto);
      return;
    }
    await this.armazenamento.setItem(CHAVES.desviosEmAberto, JSON.stringify(conteudo));
  }
}

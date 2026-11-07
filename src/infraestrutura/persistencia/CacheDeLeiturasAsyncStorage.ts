import { Leitura } from '@/dominio/modelos/Leitura';
import { CacheDeLeituras } from '@/dominio/portas/CacheDeLeituras';
import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES } from './chaves';

/** Persiste a última leitura por jardim; dados inválidos são ignorados sem afetar o restante do app. */
export class CacheDeLeiturasAsyncStorage implements CacheDeLeituras {
  constructor(private readonly armazenamento: ArmazenamentoChaveValor) {}

  async obter(idJardim: string): Promise<Leitura | null> {
    const bruto = await this.armazenamento.getItem(CHAVES.leituraDoJardim(idJardim));
    if (bruto === null) return null;
    try {
      const valor: unknown = JSON.parse(bruto);
      if (!ehRegistro(valor) || typeof valor.medidaEm !== 'string') return null;
      const medidaEm = new Date(valor.medidaEm);
      if (!Number.isFinite(medidaEm.getTime())) return null;
      if (typeof valor.umidadePercentual !== 'number' || typeof valor.temperaturaCelsius !== 'number') return null;
      if (valor.luminosidadeLux !== null && typeof valor.luminosidadeLux !== 'number') return null;
      return {
        umidadePercentual: valor.umidadePercentual,
        temperaturaCelsius: valor.temperaturaCelsius,
        luminosidadeLux: valor.luminosidadeLux,
        medidaEm,
      };
    } catch {
      return null;
    }
  }

  async salvar(idJardim: string, leitura: Leitura): Promise<void> {
    await this.armazenamento.setItem(CHAVES.leituraDoJardim(idJardim), JSON.stringify(leitura));
  }
}

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

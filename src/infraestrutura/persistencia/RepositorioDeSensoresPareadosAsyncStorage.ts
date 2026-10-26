import { SensorPareado } from '@/aplicacao/portas/PareamentoDoSensor';
import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES } from './chaves';

/** Mantém o formato antigo de um sensor legível até a primeira gravação da lista. */
export class RepositorioDeSensoresPareadosAsyncStorage {
  constructor(private readonly armazenamento: ArmazenamentoChaveValor) {}

  async listar(): Promise<readonly SensorPareado[]> {
    const novo = await this.armazenamento.getItem(CHAVES.sensoresPareados);
    if (novo !== null) {
      try {
        const lista: unknown = JSON.parse(novo);
        if (Array.isArray(lista)) return lista.filter(sensorValido);
      } catch { /* Dados ilegíveis equivalem a nenhum sensor. */ }
      return [];
    }
    const antigo = await this.armazenamento.getItem(CHAVES.sensorPareado);
    try {
      const sensor: unknown = antigo === null ? null : JSON.parse(antigo);
      return sensorValido(sensor) ? [sensor] : [];
    } catch {
      return [];
    }
  }

  async salvar(sensor: SensorPareado): Promise<void> {
    const lista = await this.listar();
    await this.armazenamento.setItem(CHAVES.sensoresPareados,
      JSON.stringify([...lista.filter((item) => item.id !== sensor.id), sensor]));
  }

  async esquecer(id: string): Promise<void> {
    const lista = await this.listar();
    await this.armazenamento.setItem(CHAVES.sensoresPareados,
      JSON.stringify(lista.filter((item) => item.id !== id)));
  }
}

function sensorValido(valor: unknown): valor is SensorPareado {
  if (typeof valor !== 'object' || valor === null) return false;
  const sensor = valor as Record<string, unknown>;
  return typeof sensor.id === 'string' && sensor.id.length > 0 && typeof sensor.nome === 'string';
}

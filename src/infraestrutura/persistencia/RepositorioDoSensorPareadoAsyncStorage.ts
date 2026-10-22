import { SensorPareado } from '@/aplicacao/portas/PareamentoDoSensor';
import { GuardaDoSensorPareado } from '../sensores/SensorBluetooth';
import { ArmazenamentoChaveValor } from './ArmazenamentoChaveValor';
import { CHAVES } from './chaves';

/** Conteúdo ilegível conta como "nenhum sensor pareado": a pessoa só precisa parear de novo. */
export class RepositorioDoSensorPareadoAsyncStorage implements GuardaDoSensorPareado {
  constructor(private readonly armazenamento: ArmazenamentoChaveValor) {}

  async obter(): Promise<SensorPareado | null> {
    const bruto = await this.armazenamento.getItem(CHAVES.sensorPareado);
    if (bruto === null) return null;
    try {
      const { id, nome } = JSON.parse(bruto) as Record<string, unknown>;
      return typeof id === 'string' && typeof nome === 'string' ? { id, nome } : null;
    } catch {
      return null;
    }
  }

  async salvar(sensor: SensorPareado): Promise<void> {
    await this.armazenamento.setItem(CHAVES.sensorPareado, JSON.stringify({ id: sensor.id, nome: sensor.nome }));
  }

  async esquecer(): Promise<void> {
    await this.armazenamento.removeItem(CHAVES.sensorPareado);
  }
}

import { Relogio } from '@/dominio/portas/Relogio';
import { ArmazenamentoChaveValor } from '@/infraestrutura/persistencia/ArmazenamentoChaveValor';
import { RepositorioDoSensorPareadoAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDoSensorPareadoAsyncStorage';
import { SensorBluetooth } from '@/infraestrutura/sensores/SensorBluetooth';

/**
 * A biblioteca BLE só é carregada aqui, e só quando o módulo nativo existe: o Expo Go, a web e os testes
 * nunca chegam a importá-la.
 */
export function criarSensorBluetooth(armazenamento: ArmazenamentoChaveValor, relogio: Relogio): SensorBluetooth | null {
  const { ClienteBlePlx, bluetoothDisponivel } =
    require('@/infraestrutura/sensores/ClienteBlePlx') as typeof import('@/infraestrutura/sensores/ClienteBlePlx');
  if (!bluetoothDisponivel()) return null;
  return new SensorBluetooth(new ClienteBlePlx(), new RepositorioDoSensorPareadoAsyncStorage(armazenamento), relogio);
}

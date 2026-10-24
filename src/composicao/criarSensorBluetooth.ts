import { Relogio } from '@/dominio/portas/Relogio';
import { ArmazenamentoChaveValor } from '@/infraestrutura/persistencia/ArmazenamentoChaveValor';
import { RepositorioDeSensoresPareadosAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeSensoresPareadosAsyncStorage';
import { CentralDeSensoresBluetooth } from '@/infraestrutura/sensores/CentralDeSensoresBluetooth';

/**
 * A biblioteca BLE só é carregada aqui, e só quando o módulo nativo existe: o Expo Go, a web e os testes
 * nunca chegam a importá-la.
 */
export function criarSensorBluetooth(armazenamento: ArmazenamentoChaveValor, relogio: Relogio): CentralDeSensoresBluetooth | null {
  const { ClienteBlePlx, bluetoothDisponivel } =
    require('@/infraestrutura/sensores/ClienteBlePlx') as typeof import('@/infraestrutura/sensores/ClienteBlePlx');
  if (!bluetoothDisponivel()) return null;
  return new CentralDeSensoresBluetooth(new ClienteBlePlx(), new RepositorioDeSensoresPareadosAsyncStorage(armazenamento), relogio);
}

import { Relogio } from '@/dominio/portas/Relogio';
import { ArmazenamentoChaveValor } from '@/infraestrutura/persistencia/ArmazenamentoChaveValor';
import { RepositorioDeSensoresPareadosAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDeSensoresPareadosAsyncStorage';
import { CentralDeSensoresBluetooth } from '@/infraestrutura/sensores/CentralDeSensoresBluetooth';

/** Undefined até a primeira montagem; null quando o aparelho não tem o módulo nativo de Bluetooth. */
let centralDoProcesso: CentralDeSensoresBluetooth | null | undefined;

/**
 * A biblioteca BLE só é carregada aqui, e só quando o módulo nativo existe: o Expo Go, a web e os testes
 * nunca chegam a importá-la.
 *
 * A central é uma só por processo. O app e a tarefa de segundo plano montam cada um o seu container; com uma
 * central em cada, a tarefa abriria uma segunda conexão com um sensor que, conforme o firmware, aceita uma só,
 * e ficaria sem leitura. Compartilhada, a tarefa aproveita a conexão e a leitura que o app já tem.
 */
export function criarSensorBluetooth(armazenamento: ArmazenamentoChaveValor, relogio: Relogio): CentralDeSensoresBluetooth | null {
  if (centralDoProcesso !== undefined) return centralDoProcesso;
  const { ClienteBlePlx, bluetoothDisponivel } =
    require('@/infraestrutura/sensores/ClienteBlePlx') as typeof import('@/infraestrutura/sensores/ClienteBlePlx');
  centralDoProcesso = bluetoothDisponivel()
    ? new CentralDeSensoresBluetooth(new ClienteBlePlx(), new RepositorioDeSensoresPareadosAsyncStorage(armazenamento), relogio)
    : null;
  return centralDoProcesso;
}

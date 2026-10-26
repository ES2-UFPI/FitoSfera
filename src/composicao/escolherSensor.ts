import { Relogio } from '@/dominio/portas/Relogio';
import { SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { SensorIndisponivel } from '@/infraestrutura/sensores/SensorIndisponivel';
import { SensorSimulado } from '@/infraestrutura/sensores/SensorSimulado';

/**
 * Escolhe o sensor pelo valor de `EXPO_PUBLIC_SENSOR`. Sem valor, o desenvolvimento usa o simulado e a produção
 * usa o Bluetooth. Quando o Bluetooth não existe no app (Expo Go, web), `criarBluetooth` devolve null e o sensor
 * fica indisponível: o app nunca finge ter leituras.
 */
export function escolherSensor(
  variavel: string | undefined,
  relogio: Relogio,
  emDesenvolvimento = false,
  criarBluetooth: () => SensorDeAmbiente | null = () => null,
): SensorDeAmbiente {
  const escolha = variavel?.trim().toLowerCase();
  switch (escolha) {
    case 'simulado':
      return new SensorSimulado(relogio);
    case 'bluetooth':
      return criarBluetooth() ?? new SensorIndisponivel();
    case undefined:
    case '':
      return emDesenvolvimento ? new SensorSimulado(relogio) : (criarBluetooth() ?? new SensorIndisponivel());
    default:
      return new SensorIndisponivel();
  }
}

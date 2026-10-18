import { Relogio } from '@/dominio/portas/Relogio';
import { SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { SensorIndisponivel } from '@/infraestrutura/sensores/SensorIndisponivel';
import { SensorSimulado } from '@/infraestrutura/sensores/SensorSimulado';

/**
 * Escolhe o sensor pelo valor de `EXPO_PUBLIC_SENSOR`. Sem valor, ou com um valor desconhecido, fica o
 * sensor indisponível: o app nunca finge ter leituras que não tem. Um sensor novo (BLE, por exemplo) entra aqui,
 * sem mexer em `aplicacao/` nem em `apresentacao/`.
 */
export function escolherSensor(variavel: string | undefined, relogio: Relogio): SensorDeAmbiente {
  switch (variavel?.trim().toLowerCase()) {
    case 'simulado':
      return new SensorSimulado(relogio);
    default:
      return new SensorIndisponivel();
  }
}

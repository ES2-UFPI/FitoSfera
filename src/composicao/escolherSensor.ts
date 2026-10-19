import { Relogio } from '@/dominio/portas/Relogio';
import { SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { SensorIndisponivel } from '@/infraestrutura/sensores/SensorIndisponivel';
import { SensorSimulado } from '@/infraestrutura/sensores/SensorSimulado';

/**
 * Escolhe o sensor pelo valor de `EXPO_PUBLIC_SENSOR`. Sem valor, o desenvolvimento usa o simulado e a produção
 * fica indisponível: o app publicado nunca finge ter leituras. Um sensor novo (BLE, por exemplo) entra aqui sem
 * mexer em `aplicacao/` nem em `apresentacao/`.
 */
export function escolherSensor(
  variavel: string | undefined,
  relogio: Relogio,
  emDesenvolvimento = false,
): SensorDeAmbiente {
  const escolha = variavel?.trim().toLowerCase();
  switch (escolha) {
    case 'simulado':
      return new SensorSimulado(relogio);
    case undefined:
    case '':
      return emDesenvolvimento ? new SensorSimulado(relogio) : new SensorIndisponivel();
    default:
      return new SensorIndisponivel();
  }
}

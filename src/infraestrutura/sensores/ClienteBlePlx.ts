import { NativeModules, Permission, PermissionsAndroid, Platform } from 'react-native';
import { BleManager, State } from 'react-native-ble-plx';
import { ClienteBle, ConexaoBle, EstadoDoBluetooth } from './ClienteBle';
import { CONTRATO_DO_SENSOR } from './ContratoDoSensor';

const { servico, leitura, comando } = CONTRATO_DO_SENSOR;
const TEMPO_LIMITE_DA_CONEXAO_MS = 15_000;
/** A partir do Android 12, BLE tem permissões próprias; antes, a busca exigia localização. */
const ANDROID_12 = 31;

/** O módulo nativo só existe num development build; no Expo Go e na web, não. */
export function bluetoothDisponivel(): boolean {
  return Platform.OS !== 'web' && NativeModules.BlePlx != null;
}

function permissoesNecessarias(): Permission[] {
  const versao = typeof Platform.Version === 'number' ? Platform.Version : Number(Platform.Version);
  return versao >= ANDROID_12
    ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]
    : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
}

export class ClienteBlePlx implements ClienteBle {
  private readonly gerente = new BleManager();

  async pedirPermissoes(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    const permissoes = permissoesNecessarias();
    const resultado = await PermissionsAndroid.requestMultiple(permissoes);
    return permissoes.every((permissao) => resultado[permissao] === PermissionsAndroid.RESULTS.GRANTED);
  }

  async temPermissoes(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    const concedidas = await Promise.all(permissoesNecessarias().map((permissao) => PermissionsAndroid.check(permissao)));
    return concedidas.every(Boolean);
  }

  async consultarEstado(): Promise<EstadoDoBluetooth> {
    const estado = await this.gerente.state();
    if (estado === State.PoweredOn) return 'ligado';
    return estado === State.PoweredOff ? 'desligado' : 'desconhecido';
  }

  procurar(aoEncontrar: Parameters<ClienteBle['procurar']>[0], aoFalhar: (erro: unknown) => void): () => void {
    this.gerente
      .startDeviceScan([servico], { allowDuplicates: true }, (erro, dispositivo) => {
        if (erro) aoFalhar(erro);
        else if (dispositivo)
          aoEncontrar({ id: dispositivo.id, nome: dispositivo.name ?? dispositivo.localName, rssi: dispositivo.rssi });
      })
      .catch(aoFalhar);
    return () => void this.gerente.stopDeviceScan().catch(() => undefined);
  }

  async conectar(id: string): Promise<ConexaoBle> {
    await this.gerente.connectToDevice(id, { timeout: TEMPO_LIMITE_DA_CONEXAO_MS });
    await this.gerente.discoverAllServicesAndCharacteristicsForDevice(id);
    const gerente = this.gerente;
    return {
      monitorar(aoReceber) {
        const assinatura = gerente.monitorCharacteristicForDevice(id, servico, leitura, (erro, caracteristica) => {
          if (!erro) aoReceber(caracteristica?.value ?? null);
        });
        return () => assinatura.remove();
      },
      async ler() {
        return (await gerente.readCharacteristicForDevice(id, servico, leitura)).value ?? null;
      },
      async pedirLeitura() {
        await gerente.writeCharacteristicWithResponseForDevice(id, servico, comando, CONTRATO_DO_SENSOR.pedidoDeLeitura);
      },
      aoCair(aviso) {
        const assinatura = gerente.onDeviceDisconnected(id, () => aviso());
        return () => assinatura.remove();
      },
      async desconectar() {
        await gerente.cancelDeviceConnection(id);
      },
    };
  }
}

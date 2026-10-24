import { FalhaBle, TipoDaFalhaBle } from './ClienteBle';

/**
 * Os códigos do `BleErrorCode` da `react-native-ble-plx` que o app distingue. Copiados aqui como números para
 * a tradução poder ser testada sem carregar o módulo nativo.
 */
export const CODIGOS_DO_BLE = {
  operacaoCancelada: 2,
  tempoEsgotado: 3,
  semPermissao: 101,
  bluetoothDesligado: 102,
  falhaAoConectar: 200,
  dispositivoDesconectado: 201,
  dispositivoNaoEncontrado: 204,
  dispositivoNaoConectado: 205,
  falhaAoDescobrirServicos: 300,
  falhaAoDescobrirCaracteristicas: 400,
  falhaAoEscrever: 401,
  falhaAoLer: 402,
  falhaAoNotificar: 403,
  localizacaoDesligada: 601,
} as const;

const TIPO_POR_CODIGO: ReadonlyMap<number, TipoDaFalhaBle> = new Map<number, TipoDaFalhaBle>([
  [CODIGOS_DO_BLE.tempoEsgotado, 'tempo-esgotado'],
  [CODIGOS_DO_BLE.semPermissao, 'sem-permissao'],
  // Até o Android 11 a busca BLE exige a localização ligada; para a pessoa, é uma permissão que falta.
  [CODIGOS_DO_BLE.localizacaoDesligada, 'sem-permissao'],
  [CODIGOS_DO_BLE.bluetoothDesligado, 'bluetooth-desligado'],
  [CODIGOS_DO_BLE.falhaAoConectar, 'fora-de-alcance'],
  [CODIGOS_DO_BLE.dispositivoDesconectado, 'fora-de-alcance'],
  [CODIGOS_DO_BLE.dispositivoNaoEncontrado, 'fora-de-alcance'],
  [CODIGOS_DO_BLE.dispositivoNaoConectado, 'fora-de-alcance'],
  // Conectou, mas o serviço ou as características do FitoSfera não responderam como o contrato manda.
  [CODIGOS_DO_BLE.falhaAoDescobrirServicos, 'falha-na-leitura'],
  [CODIGOS_DO_BLE.falhaAoDescobrirCaracteristicas, 'falha-na-leitura'],
  [CODIGOS_DO_BLE.falhaAoEscrever, 'falha-na-leitura'],
  [CODIGOS_DO_BLE.falhaAoLer, 'falha-na-leitura'],
  [CODIGOS_DO_BLE.falhaAoNotificar, 'falha-na-leitura'],
]);

/** Traduz um erro da biblioteca BLE para um `FalhaBle`. Um `FalhaBle` passa como está. */
export function classificarErroBle(erro: unknown): FalhaBle {
  if (erro instanceof FalhaBle) return erro;
  const codigo =
    typeof erro === 'object' && erro !== null ? (erro as { errorCode?: unknown }).errorCode : undefined;
  const tipo = typeof codigo === 'number' ? TIPO_POR_CODIGO.get(codigo) : undefined;
  return new FalhaBle(tipo ?? 'desconhecido', erro);
}

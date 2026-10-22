const TAMANHO_DO_PACOTE = 8;
const LUX_AUSENTE = 0xffffffff;

export interface PacoteDoSensor {
  readonly temperaturaCelsius: number;
  readonly umidadePercentual: number;
  /** Null quando o BH1750 não respondeu. */
  readonly luminosidadeLux: number | null;
}

/**
 * Decodifica a característica de leitura, que a biblioteca BLE entrega em base64: 8 bytes little-endian com
 * temperatura (int16, centésimos de °C), umidade (uint16, centésimos de %) e luz (uint32, lux).
 * Vazio, de outro tamanho ou base64 inválido vira null: "ainda não há leitura".
 */
export function decodificarPacote(base64: string | null): PacoteDoSensor | null {
  if (!base64) return null;
  let binario: string;
  try {
    binario = atob(base64);
  } catch {
    return null;
  }
  if (binario.length !== TAMANHO_DO_PACOTE) return null;
  const bytes = Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
  const dados = new DataView(bytes.buffer);
  const lux = dados.getUint32(4, true);
  return {
    temperaturaCelsius: dados.getInt16(0, true) / 100,
    umidadePercentual: dados.getUint16(2, true) / 100,
    luminosidadeLux: lux === LUX_AUSENTE ? null : lux,
  };
}

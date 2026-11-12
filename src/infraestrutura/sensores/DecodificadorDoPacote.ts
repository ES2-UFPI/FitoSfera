const TAMANHO_DO_PACOTE_LEGADO = 8;
const TAMANHO_DO_PACOTE_ATUAL = 19;
const TEMPERATURA_AUSENTE = -0x8000;
const UMIDADE_AUSENTE = 0xffff;
const LUZ_AUSENTE = 0xffffffff;

interface MedicoesDoPacote {
  readonly temperaturaCelsius: number;
  readonly umidadePercentual: number;
  readonly luminosidadeLux: number | null;
}

export type PacoteDoSensor =
  | (MedicoesDoPacote & { readonly tipo: 'legado' })
  | ({
      readonly tipo: 'novo';
      readonly sequencia: number;
      readonly idReinicio: number;
      readonly luzAcumuladaLuxMinutos: number;
      readonly segundosDesdeUltimaConfirmacao: number;
      readonly temperaturaCelsius: number | null;
      readonly umidadePercentual: number | null;
      readonly luminosidadeLux: number | null;
    });

/** Decodifica os formatos de 8 bytes (legado) e 19 bytes (atual), recebidos em base64 e little-endian. */
export function decodificarPacote(base64: string | null): PacoteDoSensor | null {
  if (!base64) return null;
  let binario: string;
  try {
    binario = atob(base64);
  } catch {
    return null;
  }

  if (binario.length !== TAMANHO_DO_PACOTE_LEGADO && binario.length !== TAMANHO_DO_PACOTE_ATUAL) return null;
  const bytes = Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
  const dados = new DataView(bytes.buffer);

  if (binario.length === TAMANHO_DO_PACOTE_LEGADO) {
    const lux = dados.getUint32(4, true);
    return {
      tipo: 'legado',
      temperaturaCelsius: dados.getInt16(0, true) / 100,
      umidadePercentual: dados.getUint16(2, true) / 100,
      luminosidadeLux: lux === LUZ_AUSENTE ? null : lux,
    };
  }

  const temperatura = dados.getInt16(11, true);
  const umidade = dados.getUint16(13, true);
  const lux = dados.getUint32(15, true);
  return {
    tipo: 'novo',
    sequencia: dados.getUint8(0),
    idReinicio: dados.getUint16(1, true),
    luzAcumuladaLuxMinutos: dados.getUint32(3, true),
    segundosDesdeUltimaConfirmacao: dados.getUint32(7, true),
    temperaturaCelsius: temperatura === TEMPERATURA_AUSENTE ? null : temperatura / 100,
    umidadePercentual: umidade === UMIDADE_AUSENTE ? null : umidade / 100,
    luminosidadeLux: lux === LUZ_AUSENTE ? null : lux,
  };
}

import { TextStyle } from 'react-native';
import { CORES } from './cores';

/** Fraunces para títulos, Nunito para o resto. Os nomes batem com os de @expo-google-fonts. */
export const FONTES = {
  titulo: 'Fraunces_600SemiBold',
  texto: 'Nunito_700Bold',
  forte: 'Nunito_800ExtraBold',
  /** Nomes científicos. O Android não inventa itálico para fonte carregada, então o arquivo é próprio. */
  italico: 'Nunito_700Bold_Italic',
} as const;

export const TEXTO = {
  titulo: { fontFamily: FONTES.titulo, fontSize: 27, lineHeight: 30, color: CORES.texto },
  subtitulo: { fontFamily: FONTES.titulo, fontSize: 21, lineHeight: 26, color: CORES.texto },
  corpo: { fontFamily: FONTES.texto, fontSize: 14, lineHeight: 21, color: CORES.textoApoio },
  apoio: { fontFamily: FONTES.texto, fontSize: 12.5, lineHeight: 17, color: CORES.textoApoio },
  rotulo: { fontFamily: FONTES.forte, fontSize: 10, letterSpacing: 1.4, color: CORES.rotulo },
  botao: { fontFamily: FONTES.forte, fontSize: 14.5, color: CORES.textoDaAcao },
} satisfies Record<string, TextStyle>;

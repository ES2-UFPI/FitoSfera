import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useIdDeSvg } from '../componentes/useIdDeSvg';
import { CORES } from '../tema/cores';
import {
  ALTURA_DA_AREA_DOS_VASOS,
  ALTURA_DA_BORDA_DA_MADEIRA,
  ALTURA_DA_MADEIRA,
  ALTURA_DA_PRATELEIRA,
  ALTURA_DA_TABUA,
} from '../tema/medidas';

/** Uma tábua de madeira com três lugares. Os vasos pousam na tábua e as etiquetas pendem dela. */
export function Prateleira({ children }: { children: ReactNode }) {
  return (
    <View style={estilos.prateleira}>
      <TabuaDeMadeira estilo={estilos.tabuaDaPrateleira} />
      <View style={estilos.lugares}>{children}</View>
    </View>
  );
}

/** A tábua sozinha, com degradê de madeira e sombra. Também serve de pedestal na prévia do cadastro. */
export function TabuaDeMadeira({ estilo }: { estilo?: StyleProp<ViewStyle> }) {
  const idDaMadeira = useIdDeSvg('madeira');
  return (
    <View style={[estilos.tabua, estilo]} pointerEvents="none">
      <Svg width="100%" height={ALTURA_DA_TABUA} preserveAspectRatio="none" viewBox={`0 0 100 ${ALTURA_DA_TABUA}`}>
        <Defs>
          <LinearGradient id={idDaMadeira} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={CORES.madeiraTopo} />
            <Stop offset="1" stopColor={CORES.madeiraBase} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={ALTURA_DA_MADEIRA} fill={`url(#${idDaMadeira})`} />
        <Rect x={0} y={ALTURA_DA_MADEIRA} width={100} height={ALTURA_DA_BORDA_DA_MADEIRA} fill={CORES.madeiraBorda} />
      </Svg>
    </View>
  );
}

const estilos = StyleSheet.create({
  prateleira: { height: ALTURA_DA_PRATELEIRA },
  tabuaDaPrateleira: { position: 'absolute', top: ALTURA_DA_AREA_DOS_VASOS, left: 0, right: 0 },
  tabua: {
    height: ALTURA_DA_TABUA,
    borderRadius: 4,
    overflow: 'hidden',
    shadowColor: CORES.sombraDaMadeira,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  lugares: { flexDirection: 'row', justifyContent: 'space-around' },
});

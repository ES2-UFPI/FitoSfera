import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { CORES } from '../tema/cores';
import { useIdDeSvg } from './useIdDeSvg';

/** Fundo creme em degradê com duas faixas diagonais de luz, como sol entrando pela janela. */
export function FundoAconchegante({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const idDoFundo = useIdDeSvg('fundo');
  const idDaLuz = useIdDeSvg('luz');
  return (
    <View style={[estilos.tela, style]}>
      {/* A View posiciona; o Svg só preenche. Svg absoluto direto não estica na web. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id={idDoFundo} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={CORES.fundoTopo} />
              <Stop offset="1" stopColor={CORES.fundoBase} />
            </LinearGradient>
            <LinearGradient id={idDaLuz} x1="0" y1="0.28" x2="1" y2="0.72">
              <Stop offset="0.30" stopColor={CORES.luzDaJanela} stopOpacity={0} />
              <Stop offset="0.38" stopColor={CORES.luzDaJanela} stopOpacity={0.35} />
              <Stop offset="0.46" stopColor={CORES.luzDaJanela} stopOpacity={0} />
              <Stop offset="0.52" stopColor={CORES.luzDaJanela} stopOpacity={0} />
              <Stop offset="0.58" stopColor={CORES.luzDaJanela} stopOpacity={0.25} />
              <Stop offset="0.64" stopColor={CORES.luzDaJanela} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width="100" height="100" fill={`url(#${idDoFundo})`} />
          <Rect width="100" height="100" fill={`url(#${idDaLuz})`} />
        </Svg>
      </View>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: CORES.fundoTopo },
});

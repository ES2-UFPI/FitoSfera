import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { CORES } from '../tema/cores';
import { ALTURA_DA_AREA_DOS_VASOS, LARGURA_DO_VASO } from '../tema/medidas';

const DIAMETRO_DO_BOTAO = 38;
const PULSO_MS = 1800;

/** Vaso tracejado com um "+" pulsando: o próximo lugar livre da estante, que abre o cadastro. */
export function VasoFantasma({
  aoTocar,
  rotulo = 'Cadastrar uma nova planta',
}: {
  aoTocar: () => void;
  rotulo?: string;
}) {
  return (
    <Pressable onPress={aoTocar} accessibilityRole="button" accessibilityLabel={rotulo} style={estilos.lugar}>
      <View style={estilos.areaDoVaso}>
        <VasoTracejado />
        <BotaoMaisPulsando />
      </View>
    </Pressable>
  );
}

/** Contorno do vaso no mesmo espaço 100 × 70 do vaso desenhado. */
export function VasoTracejado({ largura = LARGURA_DO_VASO }: { largura?: number }) {
  return (
    <Svg width={largura} height={largura * 0.7} viewBox="0 0 100 70">
      <Rect
        x={10}
        y={4}
        width={80}
        height={16}
        rx={5}
        fill="none"
        stroke={CORES.tracejado}
        strokeWidth={2.4}
        strokeDasharray="5 4"
      />
      <Path
        d="M18 20 H82 L74 65 Q73 70 68 70 H32 Q27 70 26 65 Z"
        fill="none"
        stroke={CORES.tracejado}
        strokeWidth={2.4}
        strokeDasharray="5 4"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BotaoMaisPulsando() {
  const pulso = useSharedValue(0);

  useEffect(() => {
    pulso.value = withRepeat(withTiming(1, { duration: PULSO_MS, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(pulso);
  }, [pulso]);

  const botao = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulso.value * 0.1 }] }));
  const halo = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - pulso.value),
    transform: [{ scale: 0.9 + pulso.value * 0.6 }],
  }));

  return (
    <View style={estilos.centroDoBotao} pointerEvents="none">
      <Animated.View style={[estilos.circulo, estilos.halo, halo]} />
      <Animated.View style={[estilos.circulo, botao]}>
        <Svg width={18} height={18} viewBox="0 0 18 18">
          <Path d="M9 2 V16 M2 9 H16" stroke={CORES.textoDaAcao} strokeWidth={3} strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  lugar: { flex: 1, alignItems: 'center' },
  areaDoVaso: { height: ALTURA_DA_AREA_DOS_VASOS, justifyContent: 'flex-end', alignItems: 'center' },
  centroDoBotao: {
    position: 'absolute',
    top: ALTURA_DA_AREA_DOS_VASOS * 0.3,
    width: DIAMETRO_DO_BOTAO * 1.6,
    height: DIAMETRO_DO_BOTAO * 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circulo: {
    position: 'absolute',
    width: DIAMETRO_DO_BOTAO,
    height: DIAMETRO_DO_BOTAO,
    borderRadius: DIAMETRO_DO_BOTAO / 2,
    backgroundColor: CORES.acao,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: { backgroundColor: CORES.acao },
});

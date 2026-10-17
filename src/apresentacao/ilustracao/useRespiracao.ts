import { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const AMPLITUDE_EM_GRAUS = 1.5;
const CICLO_MS = 4000;
const DEFASAGEM_MS = 1300;

/**
 * Faz a planta balançar de leve a partir da base, como se respirasse.
 * A `fase` desencontra as plantas vizinhas para não balançarem juntas.
 */
export function useRespiracao(fase: number, ativo = true) {
  const angulo = useSharedValue(-AMPLITUDE_EM_GRAUS);

  useEffect(() => {
    if (!ativo) return;
    const meioCiclo = { duration: CICLO_MS / 2, easing: Easing.inOut(Easing.sin) };
    angulo.value = withDelay(
      (fase * DEFASAGEM_MS) % CICLO_MS,
      withRepeat(
        withSequence(withTiming(AMPLITUDE_EM_GRAUS, meioCiclo), withTiming(-AMPLITUDE_EM_GRAUS, meioCiclo)),
        -1,
      ),
    );
    return () => cancelAnimation(angulo);
  }, [angulo, ativo, fase]);

  return useAnimatedStyle(() => ({ transform: [{ rotate: `${ativo ? angulo.value : 0}deg` }] }));
}

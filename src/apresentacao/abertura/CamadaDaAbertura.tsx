import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { AberturaAnimada } from './AberturaAnimada';

const SUMICO_MS = 300;

/**
 * Cobre o app com a abertura e só some quando a animação acabou E o jardim já carregou,
 * o que vier por último. Depois de sumir, sai da árvore.
 */
export function CamadaDaAbertura({ jardimCarregado }: { jardimCarregado: boolean }) {
  const [animacaoTerminou, definirAnimacaoTerminou] = useState(false);
  const [visivel, definirVisivel] = useState(true);
  const opacidade = useSharedValue(1);
  const pronta = animacaoTerminou && jardimCarregado;

  useEffect(() => {
    if (!pronta) return;
    opacidade.value = withTiming(0, { duration: SUMICO_MS });
    const temporizador = setTimeout(() => definirVisivel(false), SUMICO_MS);
    return () => clearTimeout(temporizador);
  }, [opacidade, pronta]);

  const estilo = useAnimatedStyle(() => ({ opacity: opacidade.value }));

  if (!visivel) return null;
  return (
    <Animated.View testID="abertura" style={[StyleSheet.absoluteFill, estilo]} pointerEvents={pronta ? 'none' : 'auto'}>
      <AberturaAnimada aoTerminar={() => definirAnimacaoTerminou(true)} />
    </Animated.View>
  );
}

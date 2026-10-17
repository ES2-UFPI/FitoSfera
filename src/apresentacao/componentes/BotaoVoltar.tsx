import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CORES } from '../tema/cores';

/** Círculo de papel kraft com a seta de voltar. */
export function BotaoVoltar() {
  const navegador = useRouter();
  return (
    <Pressable
      // Aberto direto por um link não há tela anterior: aí "voltar" é ir para o jardim.
      onPress={() => (navegador.canGoBack() ? navegador.back() : navegador.replace('/'))}
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      hitSlop={8}
      style={({ pressed }) => [estilos.voltar, pressed && estilos.pressionado]}
    >
      <Svg width={18} height={18} viewBox="0 0 18 18">
        <Path
          d="M11.5 3 L5.5 9 L11.5 15"
          stroke={CORES.textoDoPapel}
          strokeWidth={2.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  voltar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: CORES.papel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressionado: { opacity: 0.7 },
});

import { Pressable, StyleSheet, Text } from 'react-native';
import { TEXTOS } from '@/textos';
import { CORES, ESPACO, FONTES } from '../tema';

/** O "Apagar" discreto de cada linha de histórico. O rótulo falado diz qual registro sai. */
export function BotaoDeApagar({ rotulo, aoTocar }: { rotulo: string; aoTocar(): void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={aoTocar}
      hitSlop={ESPACO.pequeno}
      style={({ pressed }) => [estilos.botao, pressed && estilos.pressionado]}
    >
      <Text style={estilos.texto}>{TEXTOS.apagarRegistro.apagar}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: { minHeight: 44, justifyContent: 'center', paddingHorizontal: ESPACO.pequeno, marginLeft: 'auto' },
  pressionado: { opacity: 0.6 },
  texto: { fontFamily: FONTES.texto, fontSize: 14, color: CORES.erro, textDecorationLine: 'underline' },
});

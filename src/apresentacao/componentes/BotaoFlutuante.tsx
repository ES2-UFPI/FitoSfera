import { Pressable, StyleSheet, Text } from 'react-native';
import { CORES } from '../tema/cores';
import { ALVO_DE_TOQUE, ESPACO, RAIO } from '../tema/medidas';
import { FONTES } from '../tema/tipografia';

export function BotaoFlutuante({ aoTocar }: { aoTocar: () => void }) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel="Nova planta"
      style={({ pressed }) => [estilos.botao, pressed && estilos.pressionado]}
    >
      <Text style={estilos.mais}>+</Text>
      <Text style={estilos.texto}>Nova planta</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    position: 'absolute',
    right: ESPACO.grande,
    bottom: ESPACO.grande,
    minHeight: ALVO_DE_TOQUE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: ESPACO.amplo,
    borderRadius: RAIO.pilula,
    backgroundColor: CORES.acao,
    shadowColor: CORES.sombraDaAcao,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  pressionado: { transform: [{ scale: 0.96 }] },
  mais: { fontFamily: FONTES.forte, fontSize: 19, lineHeight: 21, color: CORES.textoDaAcao },
  texto: { fontFamily: FONTES.forte, fontSize: 14, color: CORES.textoDaAcao },
});

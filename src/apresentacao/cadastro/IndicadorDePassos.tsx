import { StyleSheet, View } from 'react-native';
import { CORES } from '../tema/cores';

export const TOTAL_DE_PASSOS = 3;
export type Passo = 1 | 2 | 3;

/** Três barrinhas: as dos passos feitos e a do atual ficam verdes. */
export function IndicadorDePassos({ passoAtual }: { passoAtual: Passo }) {
  return (
    <View style={estilos.linha} accessible accessibilityLabel={`Passo ${passoAtual} de ${TOTAL_DE_PASSOS}`}>
      {Array.from({ length: TOTAL_DE_PASSOS }, (_, i) => (
        <View key={i} style={[estilos.barra, i < passoAtual && estilos.feita]} />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', gap: 4 },
  barra: { width: 18, height: 5, borderRadius: 3, backgroundColor: CORES.bolinhaDePasso },
  feita: { backgroundColor: CORES.acao },
});

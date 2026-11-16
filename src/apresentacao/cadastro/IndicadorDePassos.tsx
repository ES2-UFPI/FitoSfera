import { StyleSheet, View } from 'react-native';
import { TEXTOS } from '@/textos';
import { CORES, ESPACO, RAIO } from '../tema';

export const TOTAL_DE_PASSOS = 3;
export type Passo = 1 | 2 | 3;

/** Três barrinhas: as dos passos feitos e a do atual ficam verdes. */
export function IndicadorDePassos({ passoAtual }: { passoAtual: Passo }) {
  return (
    <View style={estilos.linha} accessible accessibilityLabel={TEXTOS.cadastro.passo(passoAtual, TOTAL_DE_PASSOS)}>
      {Array.from({ length: TOTAL_DE_PASSOS }, (_, i) => (
        <View key={i} style={[estilos.barra, i < passoAtual && estilos.feita]} />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', gap: ESPACO.minimo },
  barra: { width: 18, height: 5, borderRadius: RAIO.fino, backgroundColor: CORES.bolinhaDePasso },
  feita: { backgroundColor: CORES.acao },
});

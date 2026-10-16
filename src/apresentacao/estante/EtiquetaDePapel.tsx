import { StyleSheet, Text, View } from 'react-native';
import { CORES } from '../tema/cores';
import { FONTES } from '../tema/tipografia';

export type Inclinacao = 'esquerda' | 'direita';

/** Etiqueta de papel kraft pendurada por um fio, levemente torta. */
export function EtiquetaDePapel({ texto, inclinacao }: { texto: string; inclinacao: Inclinacao }) {
  return (
    <View style={estilos.etiqueta}>
      <View style={estilos.fio} />
      <View style={[estilos.papel, { transform: [{ rotate: inclinacao === 'esquerda' ? '-2deg' : '2deg' }] }]}>
        <Text style={estilos.texto} numberOfLines={1}>
          {texto}
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: { alignItems: 'center', maxWidth: '100%' },
  fio: { width: 1.5, height: 9, backgroundColor: CORES.madeiraBorda },
  papel: {
    maxWidth: '100%',
    backgroundColor: CORES.papel,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    paddingHorizontal: 7,
    paddingTop: 3,
    paddingBottom: 4,
    shadowColor: CORES.sombraDaMadeira,
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  texto: { fontFamily: FONTES.forte, fontSize: 10.5, color: CORES.textoDoPapel },
});

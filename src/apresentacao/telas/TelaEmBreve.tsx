import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { CORES } from '../tema/cores';
import { ESPACO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';

/** Abas que ainda vão ganhar conteúdo em outras histórias. */
export function TelaEmBreve({ titulo, descricao }: { titulo: string; descricao: string }) {
  const margens = useSafeAreaInsets();
  return (
    <FundoAconchegante>
      <View style={[estilos.conteudo, { paddingTop: margens.top + ESPACO.medio }]}>
        <Text style={TEXTO.titulo} accessibilityRole="header">
          {titulo}
        </Text>
        <View style={estilos.aviso}>
          <Text style={estilos.emBreve}>Em breve</Text>
          <Text style={TEXTO.corpo}>{descricao}</Text>
        </View>
      </View>
    </FundoAconchegante>
  );
}

const estilos = StyleSheet.create({
  conteudo: { flex: 1, paddingHorizontal: ESPACO.amplo },
  aviso: { flex: 1, justifyContent: 'center', gap: ESPACO.pequeno, paddingBottom: ESPACO.folgado * 3 },
  emBreve: { fontFamily: FONTES.titulo, fontSize: 21, color: CORES.acao },
});

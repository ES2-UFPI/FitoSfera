import { StyleSheet, Text, View } from 'react-native';
import { ESPACO } from '../tema/medidas';
import { TEXTO } from '../tema/tipografia';
import { dataPorExtenso, descreverQuantidade, saudacaoPara } from './textosDoCabecalho';

/** Data, saudação pelo horário e quantas plantas estão na estante. */
export function CabecalhoDoJardim({ quantidade }: { quantidade: number }) {
  const agora = new Date();
  return (
    <View style={estilos.cabecalho}>
      <Text style={TEXTO.rotulo}>{dataPorExtenso(agora)}</Text>
      <View style={estilos.titulo} accessibilityRole="header">
        <Text style={TEXTO.titulo}>{saudacaoPara(agora)}!</Text>
        <Text style={TEXTO.titulo}>Seu cantinho verde</Text>
      </View>
      <Text style={TEXTO.apoio}>{descreverQuantidade(quantidade)}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { paddingHorizontal: ESPACO.amplo, paddingTop: ESPACO.medio, gap: ESPACO.minimo + 2 },
  titulo: { marginTop: 2 },
});

import { StyleSheet, View } from 'react-native';
import { Aparencia } from '@/dominio/modelos/Aparencia';
import { EtiquetaDePapel } from '../estante/EtiquetaDePapel';
import { TabuaDeMadeira } from '../estante/Prateleira';
import { DesenhoDaPlanta } from '../ilustracao/DesenhoDaPlanta';
import { ESPACO } from '../tema/medidas';

const LARGURA_DA_PREVIA = 92;

/** Prévia do cadastro: a planta como vai ficar, num pedaço de prateleira, com a etiqueta. */
export function VitrineDaPlanta({ aparencia, etiqueta }: { aparencia: Aparencia; etiqueta: string }) {
  return (
    <View style={estilos.vitrine}>
      <DesenhoDaPlanta aparencia={aparencia} largura={LARGURA_DA_PREVIA} respirando />
      <TabuaDeMadeira estilo={estilos.tabua} />
      <EtiquetaDePapel texto={etiqueta} inclinacao="esquerda" />
    </View>
  );
}

const estilos = StyleSheet.create({
  vitrine: { alignItems: 'center', marginTop: ESPACO.pequeno },
  tabua: { alignSelf: 'stretch', marginHorizontal: ESPACO.folgado * 2 },
});

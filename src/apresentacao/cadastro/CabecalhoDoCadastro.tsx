import { StyleSheet, View } from 'react-native';
import { BotaoVoltar } from '../componentes/BotaoVoltar';
import { ALVO_DE_TOQUE, ESPACO } from '../tema/medidas';
import { IndicadorDePassos, Passo } from './IndicadorDePassos';

/** Voltar à esquerda e o progresso do cadastro à direita. */
export function CabecalhoDoCadastro({ passoAtual }: { passoAtual: Passo }) {
  return (
    <View style={estilos.cabecalho}>
      <BotaoVoltar />
      <IndicadorDePassos passoAtual={passoAtual} />
    </View>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ESPACO.grande,
    minHeight: ALVO_DE_TOQUE,
  },
});

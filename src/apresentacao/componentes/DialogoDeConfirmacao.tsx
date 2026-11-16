import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { TEXTOS } from '@/textos';
import { CORES, ESPACO, LARGURA_DO_MODAL, RAIO, TEXTO } from '../tema';
import { BotaoPrincipal } from './BotaoPrincipal';

interface Props {
  readonly titulo: string;
  readonly explicacao: string;
  readonly tituloDoBotao: string;
  /** Texto do botão enquanto a ação roda; os dois botões ficam travados nesse meio-tempo. */
  readonly tituloEmAndamento: string;
  readonly mensagemDeErro: string;
  readonly visivel: boolean;
  readonly emAndamento: boolean;
  readonly erro: boolean;
  aoConfirmar(): void;
  aoCancelar(): void;
}

/** A pergunta antes de algo que não volta atrás: excluir uma planta, apagar uma rega ou uma colheita. */
export function DialogoDeConfirmacao({
  titulo, explicacao, tituloDoBotao, tituloEmAndamento, mensagemDeErro, visivel, emAndamento, erro, aoConfirmar,
  aoCancelar,
}: Props) {
  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoCancelar}>
      <Pressable style={estilos.fundo} onPress={emAndamento ? undefined : aoCancelar} accessible={false}>
        <Pressable style={estilos.cartao} accessibilityViewIsModal>
          <Text style={TEXTO.subtitulo} accessibilityRole="header">
            {titulo}
          </Text>
          <Text style={TEXTO.corpo}>{explicacao}</Text>
          {erro ? (
            <Text style={[TEXTO.corpo, estilos.erro]} accessibilityRole="alert">
              {mensagemDeErro}
            </Text>
          ) : null}
          <View style={estilos.botoes}>
            <BotaoPrincipal titulo={TEXTOS.comum.cancelar} variante="secundaria" aoTocar={aoCancelar} desabilitado={emAndamento} />
            <BotaoPrincipal
              titulo={emAndamento ? tituloEmAndamento : tituloDoBotao}
              variante="perigo"
              aoTocar={aoConfirmar}
              desabilitado={emAndamento}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fundo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ESPACO.folgado,
    backgroundColor: CORES.veuDoModal,
  },
  cartao: {
    width: '100%',
    maxWidth: LARGURA_DO_MODAL,
    padding: ESPACO.folgado,
    borderRadius: RAIO.grande,
    backgroundColor: CORES.superficie,
    gap: ESPACO.medio,
  },
  botoes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: ESPACO.pequeno },
  erro: { color: CORES.erro },
});

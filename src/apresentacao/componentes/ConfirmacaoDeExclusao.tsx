import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { TEXTOS } from '@/textos';
import { CORES } from '../tema/cores';
import { ESPACO, RAIO } from '../tema/medidas';
import { TEXTO } from '../tema/tipografia';
import { BotaoPrincipal } from './BotaoPrincipal';

interface Props {
  readonly apelido: string;
  readonly visivel: boolean;
  readonly excluindo: boolean;
  readonly erro: boolean;
  aoConfirmar(): void;
  aoCancelar(): void;
}

export function ConfirmacaoDeExclusao({ apelido, visivel, excluindo, erro, aoConfirmar, aoCancelar }: Props) {
  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoCancelar}>
      <Pressable style={estilos.fundo} onPress={excluindo ? undefined : aoCancelar} accessible={false}>
        <Pressable style={estilos.cartao} accessibilityViewIsModal>
          <Text style={TEXTO.subtitulo} accessibilityRole="header">
            {TEXTOS.exclusao.titulo(apelido)}
          </Text>
          <Text style={TEXTO.corpo}>{TEXTOS.exclusao.explicacao}</Text>
          {erro ? (
            <Text style={[TEXTO.corpo, estilos.erro]} accessibilityRole="alert">
              {TEXTOS.exclusao.falha}
            </Text>
          ) : null}
          <View style={estilos.botoes}>
            <BotaoPrincipal titulo={TEXTOS.comum.cancelar} variante="secundaria" aoTocar={aoCancelar} desabilitado={excluindo} />
            <BotaoPrincipal
              titulo={excluindo ? TEXTOS.exclusao.excluindo : TEXTOS.exclusao.excluirPlanta}
              variante="perigo"
              aoTocar={aoConfirmar}
              desabilitado={excluindo}
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
    backgroundColor: 'rgba(61, 51, 38, 0.45)',
  },
  cartao: {
    width: '100%',
    maxWidth: 420,
    padding: ESPACO.folgado,
    borderRadius: RAIO.grande,
    backgroundColor: CORES.superficie,
    gap: ESPACO.medio,
  },
  botoes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: ESPACO.pequeno },
  erro: { color: CORES.erro },
});

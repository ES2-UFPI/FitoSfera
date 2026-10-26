import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CORES } from '../tema/cores';
import { ALVO_DE_TOQUE, ESPACO, RAIO } from '../tema/medidas';
import { TEXTO } from '../tema/tipografia';

interface Props {
  titulo: string;
  aoTocar: () => void;
  desabilitado?: boolean;
  largo?: boolean;
  testID?: string;
  icone?: ReactNode;
  variante?: 'padrao' | 'rega' | 'secundaria' | 'perigo';
}

export function BotaoPrincipal({
  titulo,
  aoTocar,
  desabilitado = false,
  largo = false,
  testID,
  icone,
  variante = 'padrao',
}: Props) {
  return (
    <Pressable
      onPress={aoTocar}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: desabilitado }}
      testID={testID}
      style={({ pressed }) => [
        estilos.botao,
        variante === 'rega' && estilos.rega,
        variante === 'secundaria' && estilos.secundaria,
        variante === 'perigo' && estilos.perigo,
        largo && estilos.largo,
        pressed && estilos.pressionado,
        desabilitado && estilos.desabilitado,
      ]}
    >
      <View style={estilos.conteudo}>
        {icone}
        <Text style={[TEXTO.botao, variante === 'secundaria' && estilos.textoSecundario]}>{titulo}</Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    minHeight: ALVO_DE_TOQUE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ESPACO.folgado,
    borderRadius: RAIO.pilula,
    backgroundColor: CORES.acao,
    shadowColor: CORES.sombraDaAcao,
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  largo: { alignSelf: 'stretch', minHeight: 52 },
  conteudo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ESPACO.pequeno },
  rega: { backgroundColor: CORES.acaoRega, shadowColor: CORES.sombraDaAcaoRega },
  secundaria: {
    backgroundColor: CORES.superficie,
    borderWidth: 1.5,
    borderColor: CORES.acao,
    shadowOpacity: 0,
    elevation: 0,
  },
  textoSecundario: { color: CORES.acao },
  perigo: { backgroundColor: CORES.erro, shadowColor: CORES.erro, shadowOpacity: 0.2 },
  pressionado: { transform: [{ scale: 0.97 }] },
  desabilitado: { opacity: 0.45 },
});

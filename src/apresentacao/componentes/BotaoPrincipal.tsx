import { Pressable, StyleSheet, Text } from 'react-native';
import { CORES } from '../tema/cores';
import { ALVO_DE_TOQUE, ESPACO, RAIO } from '../tema/medidas';
import { TEXTO } from '../tema/tipografia';

interface Props {
  titulo: string;
  aoTocar: () => void;
  desabilitado?: boolean;
  /** Ocupa a largura toda, para o botão de avançar no rodapé das telas de cadastro. */
  largo?: boolean;
  testID?: string;
}

/** A ação principal de cada tela: verde-folha, em formato de pílula. */
export function BotaoPrincipal({ titulo, aoTocar, desabilitado = false, largo = false, testID }: Props) {
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
        largo && estilos.largo,
        pressed && estilos.pressionado,
        desabilitado && estilos.desabilitado,
      ]}
    >
      <Text style={TEXTO.botao}>{titulo}</Text>
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
  pressionado: { transform: [{ scale: 0.97 }] },
  desabilitado: { opacity: 0.45 },
});

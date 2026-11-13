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
  variante?: VarianteDoBotao;
}

/**
 * `padrao`, `rega` e `perigo` são preenchidos e com sombra: a ação principal da tela, e só uma por tela (US07).
 * `secundaria` e `perigoDiscreto` têm só contorno, para o resto. `perigo` cheio fica para a confirmação de algo
 * que não se desfaz; fora dela, excluir é `perigoDiscreto` e não compete com a ação principal.
 */
export type VarianteDoBotao = 'padrao' | 'rega' | 'secundaria' | 'perigo' | 'perigoDiscreto';

export function ehVariantePrincipal(variante: VarianteDoBotao): boolean {
  return variante === 'padrao' || variante === 'rega' || variante === 'perigo';
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
        variante === 'perigoDiscreto' && estilos.perigoDiscreto,
        largo && estilos.largo,
        pressed && estilos.pressionado,
        desabilitado && estilos.desabilitado,
      ]}
    >
      <View style={estilos.conteudo}>
        {icone}
        <Text
          style={[
            TEXTO.botao,
            variante === 'secundaria' && estilos.textoSecundario,
            variante === 'perigoDiscreto' && estilos.textoDoPerigoDiscreto,
          ]}
        >
          {titulo}
        </Text>
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
  perigoDiscreto: {
    backgroundColor: CORES.superficie,
    borderWidth: 1.5,
    borderColor: CORES.erro,
    shadowOpacity: 0,
    elevation: 0,
  },
  textoDoPerigoDiscreto: { color: CORES.erro },
  pressionado: { transform: [{ scale: 0.97 }] },
  desabilitado: { opacity: 0.45 },
});

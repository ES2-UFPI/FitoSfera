import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CORES, ESPACO, FONTES, LARGURA_DA_LEITURA, TEXTO } from '../tema';

/**
 * O estado vazio do app (US07, #40): o que ainda não existe e, quando houver, como começar. Nunca uma lista vazia
 * sem explicação.
 *
 * - `tela`: ocupa o espaço da tela, centralizado, com um desenho opcional (o histórico sem regas).
 * - `cartao`: dentro de um cartão, alinhado à esquerda (as colheitas, a busca sem resultado).
 *
 * O estado vazio da estante (`telas/EstadoVazio`) é a versão ilustrada desta, com os vasos tracejados.
 */
export function MensagemDeVazio({
  titulo,
  texto,
  icone,
  forma = 'cartao',
  testID,
}: {
  titulo: string;
  texto?: string;
  icone?: ReactNode;
  forma?: 'tela' | 'cartao';
  testID?: string;
}) {
  const naTela = forma === 'tela';
  return (
    <View style={naTela ? estilos.tela : estilos.cartao} accessible={!naTela} testID={testID}>
      {icone ? (
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {icone}
        </View>
      ) : null}
      <Text style={naTela ? TEXTO.subtitulo : estilos.tituloNoCartao} accessibilityRole={naTela ? 'header' : undefined}>
        {titulo}
      </Text>
      {texto ? <Text style={naTela ? [TEXTO.corpo, estilos.textoNaTela] : TEXTO.apoio}>{texto}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACO.pequeno,
    paddingBottom: ESPACO.folgado * 2,
  },
  textoNaTela: { textAlign: 'center', maxWidth: LARGURA_DA_LEITURA },
  cartao: { gap: ESPACO.fino },
  tituloNoCartao: { fontFamily: FONTES.forte, fontSize: 16, color: CORES.texto },
});

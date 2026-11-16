import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { CORES, ESPACO, LARGURA_DO_CONTEUDO, RAIO } from '../tema';

/**
 * O cartão do app (US07, #40): fundo claro, borda fina e o mesmo raio e espaço internos em todas as telas. Antes,
 * cada tela desenhava o seu, e a tela da planta e os Ajustes já não combinavam.
 *
 * `compacto` tira o espaço interno, para cartões que montam o próprio cabeçalho tocável, como os de abrir e fechar
 * da tela do jardim. `estilo` só acrescenta (uma cor de destaque, por exemplo); a base não muda.
 */
export function Cartao({
  children,
  compacto = false,
  estilo,
  ...props
}: {
  children: ReactNode;
  compacto?: boolean;
  estilo?: StyleProp<ViewStyle>;
} & Omit<ViewProps, 'style'>) {
  return (
    <View {...props} style={[estilos.cartao, compacto && estilos.compacto, estilo]}>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    width: '100%',
    maxWidth: LARGURA_DO_CONTEUDO,
    alignSelf: 'center',
    padding: ESPACO.grande,
    gap: ESPACO.medio,
    borderRadius: RAIO.medio,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    backgroundColor: CORES.superficie,
  },
  compacto: { padding: 0, gap: 0, overflow: 'hidden' },
});

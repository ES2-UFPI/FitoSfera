import { StyleSheet, Text } from 'react-native';
import { NivelDeDificuldade } from '@/dominio/modelos/EspecieVegetal';
import { CORES, FONTES } from '../tema';
import { APRESENTACAO_DA_DIFICULDADE } from './textosDaDificuldade';

/**
 * O nível de dificuldade da espécie, em maiúsculas pequenas: "FÁCIL", "MÉDIO" ou "EXIGENTE".
 *
 * O nível nunca sai só na cor: o rótulo é texto, e é isso que serve a quem não distingue as cores e a quem
 * usa leitor de tela. A cor acompanha, não substitui.
 *
 * `sobreFundoTingido` existe por contraste, não por estética. Sobre superfície clara o selo usa a cor do
 * nível; sobre o fundo tingido do cartão do detalhe essa mesma cor cai para 3,78:1 no médio, abaixo dos
 * 4,5:1 que texto pequeno exige, e aí o selo vai em `CORES.texto` — ali o próprio fundo já diz o nível.
 */
export function SeloDeDificuldade({
  nivel,
  sobreFundoTingido = false,
}: {
  nivel: NivelDeDificuldade;
  sobreFundoTingido?: boolean;
}) {
  const { curto, cor } = APRESENTACAO_DA_DIFICULDADE[nivel];
  return (
    <Text
      testID="selo-dificuldade"
      style={[estilos.selo, sobreFundoTingido ? estilos.sobreFundoTingido : { color: cor }]}
    >
      {curto}
    </Text>
  );
}

const estilos = StyleSheet.create({
  selo: { fontFamily: FONTES.forte, fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase' },
  /** No cartão o selo é um pouco maior, porque ali ele divide a linha com um subtítulo, não com um nome. */
  sobreFundoTingido: { fontSize: 10.5, letterSpacing: 1.3, color: CORES.texto },
});

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { Prateleira } from '../estante/Prateleira';
import { VasoFantasma } from '../estante/VasoFantasma';
import { CORES } from '../tema/cores';
import { ALTURA_DA_AREA_DOS_VASOS, ESPACO, LARGURA_DO_VASO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';

const GrupoAnimado = Animated.createAnimatedComponent(G);
const PASSOS = ['busque', 'monte', 'batize'];

/** O jardim antes da primeira planta: vasos fantasma mostrando o que pode nascer ali. */
export function EstadoVazio({ aoComecar }: { aoComecar: () => void }) {
  return (
    <View style={estilos.tela}>
      <View style={estilos.estante}>
        <Prateleira>
          <ContornoDePlanta tipo="erva" />
          <VasoFantasma aoTocar={aoComecar} rotulo="Cadastrar a primeira planta" />
          <ContornoDePlanta tipo="flor" />
        </Prateleira>
      </View>

      <View style={estilos.convite}>
        <Text style={TEXTO.subtitulo} accessibilityRole="header">
          Monte sua primeira planta
        </Text>
        <Text style={[TEXTO.corpo, estilos.texto]}>
          Busque pelo nome, escolha a forma e as cores, e dê um apelido carinhoso.
        </Text>
        <BotaoPrincipal titulo="＋ Começar" aoTocar={aoComecar} />
        <View style={estilos.passos}>
          {PASSOS.map((passo, indice) => (
            <View key={passo} style={estilos.passo}>
              <View style={estilos.numero}>
                <Text style={estilos.textoDoNumero}>{indice + 1}</Text>
              </View>
              <Text style={estilos.textoDoPasso}>{passo}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/** Contorno tracejado de uma planta no vaso, com o tracejado andando devagar. */
function ContornoDePlanta({ tipo }: { tipo: 'erva' | 'flor' }) {
  const deslocamento = useSharedValue(0);

  useEffect(() => {
    deslocamento.value = withRepeat(withTiming(-90, { duration: 6000, easing: Easing.linear }), -1);
    return () => cancelAnimation(deslocamento);
  }, [deslocamento]);

  const tracejado = useAnimatedProps(() => ({ strokeDashoffset: deslocamento.value }));

  return (
    <View style={estilos.lugar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={LARGURA_DO_VASO} height={ALTURA_DA_AREA_DOS_VASOS} viewBox="0 0 60 130">
        <GrupoAnimado
          animatedProps={tracejado}
          fill="none"
          stroke={CORES.tracejado}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="5 4"
        >
          {tipo === 'erva' ? (
            <>
              <Path d="M30 94 V46 M30 78 Q20 70 12 64 M30 68 Q42 60 50 54 M30 56 Q24 48 18 42" />
              <Ellipse cx={11} cy={62} rx={10} ry={6} transform="rotate(-25 11 62)" />
              <Ellipse cx={51} cy={52} rx={10} ry={6} transform="rotate(25 51 52)" />
              <Ellipse cx={30} cy={38} rx={7} ry={10} />
            </>
          ) : (
            <>
              <Path d="M30 94 Q28 72 30 42 M30 94 Q20 76 14 56 M30 94 Q40 76 46 54" />
              <Circle cx={30} cy={36} r={8} />
              <Circle cx={14} cy={52} r={7} />
              <Circle cx={46} cy={50} r={7} />
            </>
          )}
          <Path d="M4 98 H56 L50 129 H10 Z" />
        </GrupoAnimado>
      </Svg>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  estante: { marginTop: ESPACO.grande, paddingHorizontal: ESPACO.medio },
  lugar: { flex: 1, height: ALTURA_DA_AREA_DOS_VASOS, alignItems: 'center' },
  convite: { alignItems: 'center', paddingHorizontal: ESPACO.folgado, gap: ESPACO.medio },
  texto: { textAlign: 'center', maxWidth: 300 },
  passos: { flexDirection: 'row', gap: ESPACO.medio, marginTop: ESPACO.minimo },
  passo: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.minimo + 1 },
  numero: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: CORES.bolinhaDePasso,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoDoNumero: { fontFamily: FONTES.forte, fontSize: 10, color: CORES.textoDoPapel },
  textoDoPasso: { fontFamily: FONTES.forte, fontSize: 11.5, color: CORES.textoApoio },
});

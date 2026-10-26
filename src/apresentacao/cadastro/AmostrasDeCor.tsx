import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Vaso } from '../ilustracao/Vaso';
import { CORES } from '../tema/cores';
import { ESPACO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';

export type FormatoDaAmostra = 'folha' | 'redonda' | 'vaso';

export interface OpcaoDeCor<T extends string> {
  id: T;
  nome: string;
  /** Folha: [tom, tom claro]. Redonda: [cor]. Vaso: [corpo, borda]. */
  cores: readonly string[];
}

interface Props<T extends string> {
  rotulo: string;
  formato: FormatoDaAmostra;
  opcoes: readonly OpcaoDeCor<T>[];
  selecionada: T;
  aoEscolher: (id: T) => void;
}

const TAMANHO = 28;

/** Uma seção de cores: o rótulo, o nome da cor escolhida e as amostras no formato do que pintam. */
export function AmostrasDeCor<T extends string>({ rotulo, formato, opcoes, selecionada, aoEscolher }: Props<T>) {
  const escolhida = opcoes.find((opcao) => opcao.id === selecionada);
  return (
    <View style={estilos.secao}>
      <View style={estilos.cabecalho}>
        <Text style={TEXTO.rotulo}>{rotulo.toUpperCase()}</Text>
        <Text style={estilos.nomeEscolhido}>{escolhida?.nome}</Text>
      </View>
      <View style={estilos.amostras}>
        {opcoes.map((opcao) => {
          const marcada = opcao.id === selecionada;
          return (
            <Pressable
              key={opcao.id}
              onPress={() => aoEscolher(opcao.id)}
              accessibilityRole="button"
              accessibilityLabel={`${rotulo}: ${opcao.nome}`}
              accessibilityState={{ selected: marcada }}
              hitSlop={4}
              style={[estilos.alvo, marcada && estilos.marcada]}
            >
              <Amostra formato={formato} cores={opcao.cores} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Amostra({ formato, cores }: { formato: FormatoDaAmostra; cores: readonly string[] }) {
  if (formato === 'redonda') return <View style={[estilos.redonda, { backgroundColor: cores[0] }]} />;
  if (formato === 'vaso') {
    return (
      <Svg width={TAMANHO} height={TAMANHO * 0.7} viewBox="0 0 100 70">
        <Vaso corpo={cores[0]} borda={cores[1]} />
      </Svg>
    );
  }
  return (
    <Svg width={TAMANHO} height={TAMANHO} viewBox="0 0 28 28">
      <Path d="M2 26 C2 12 12 2 26 2 C26 16 16 26 2 26 Z" fill={cores[0]} />
      <Path d="M2 26 C2 12 12 2 26 2 Z" fill={cores[1]} />
    </Svg>
  );
}

const estilos = StyleSheet.create({
  secao: { paddingHorizontal: ESPACO.amplo, gap: 6 },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  nomeEscolhido: { fontFamily: FONTES.texto, fontSize: 11.5, color: CORES.textoApoio },
  amostras: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  alvo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  marcada: { borderColor: CORES.acao },
  redonda: { width: TAMANHO, height: TAMANHO, borderRadius: TAMANHO / 2 },
});

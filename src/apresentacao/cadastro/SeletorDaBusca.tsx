import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CriteriosDaBusca } from '@/aplicacao/casos-de-uso/PesquisarEspecies';
import { TEXTOS } from '@/textos';
import { CORES } from '../tema/cores';
import { ALVO_DE_TOQUE, ESPACO, RAIO } from '../tema/medidas';
import { FONTES } from '../tema/tipografia';

export type ModoDaBusca = 'todas' | 'faceis' | 'mais-faceis-primeiro';

/**
 * Filtrar e ordenar são critérios separados no caso de uso; aqui eles chegam como três escolhas exclusivas,
 * que é o controle simples que a tela pede. Não se perde combinação nenhuma: "Fáceis" já traz tudo do mesmo
 * nível, então ordenar dentro dela não mudaria a lista.
 */
export const CRITERIOS_DO_MODO: Record<ModoDaBusca, Pick<CriteriosDaBusca, 'filtro' | 'ordem'>> = {
  todas: { filtro: 'todas', ordem: 'alfabetica' },
  faceis: { filtro: 'somente-faceis', ordem: 'alfabetica' },
  'mais-faceis-primeiro': { filtro: 'todas', ordem: 'mais-faceis-primeiro' },
};

/** A ordem em que as opções aparecem, com o rótulo de cada uma. */
const OPCOES: readonly { modo: ModoDaBusca; rotulo: string }[] = [
  { modo: 'todas', rotulo: TEXTOS.cadastro.mostrarTodas },
  { modo: 'faceis', rotulo: TEXTOS.cadastro.mostrarFaceis },
  { modo: 'mais-faceis-primeiro', rotulo: TEXTOS.cadastro.maisFaceisPrimeiro },
];

/**
 * O controle de dificuldade da busca: ver todas, só as fáceis, ou todas com as mais fáceis no topo.
 *
 * Repete o padrão de pílula de opção da `TelaCompararRendimento` — grupo de rádio, borda na cor de ação na
 * escolhida —, sem extrair um componente comum: são duas telas, e unificá-las não é desta issue.
 */
export function SeletorDaBusca({
  modo,
  aoEscolher,
}: {
  modo: ModoDaBusca;
  aoEscolher: (modo: ModoDaBusca) => void;
}) {
  return (
    <View style={estilos.grupo} accessibilityRole="radiogroup" accessibilityLabel={TEXTOS.cadastro.rotuloDaBusca}>
      {OPCOES.map((opcao) => {
        const escolhida = opcao.modo === modo;
        return (
          <Pressable
            key={opcao.modo}
            testID={`opcao-da-busca-${opcao.modo}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: escolhida }}
            accessibilityLabel={opcao.rotulo}
            onPress={() => aoEscolher(opcao.modo)}
            style={({ pressed }) => [estilos.opcao, escolhida && estilos.escolhida, pressed && estilos.pressionada]}
          >
            <Text numberOfLines={1} style={[estilos.rotulo, escolhida && estilos.rotuloEscolhido]}>
              {opcao.rotulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ESPACO.pequeno,
    marginHorizontal: ESPACO.amplo,
    marginTop: ESPACO.medio,
  },
  opcao: {
    flexShrink: 1,
    minHeight: ALVO_DE_TOQUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ESPACO.medio + 2,
    borderWidth: 1.5,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.pilula,
    backgroundColor: CORES.fundoTopo,
  },
  escolhida: { borderColor: CORES.acao, backgroundColor: CORES.papel },
  pressionada: { opacity: 0.6 },
  rotulo: { fontFamily: FONTES.forte, fontSize: 13, color: CORES.textoApoio },
  rotuloEscolhido: { color: CORES.acao },
});

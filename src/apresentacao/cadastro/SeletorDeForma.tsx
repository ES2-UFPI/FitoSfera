import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Aparencia, FORMAS, IdForma } from '@/dominio/modelos/Aparencia';
import { TEXTOS } from '@/textos';
import { DesenhoDaPlanta } from '../ilustracao/DesenhoDaPlanta';
import { FORMAS_VISUAIS } from '../ilustracao/paletas';
import { CORES, ESPACO, FONTES, RAIO } from '../tema';

/** As oito formas lado a lado, cada uma já desenhada nas cores que a pessoa escolheu. */
export function SeletorDeForma({
  aparencia,
  aoEscolher,
}: {
  aparencia: Aparencia;
  aoEscolher: (forma: IdForma) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.linha}>
      {FORMAS.map((forma) => {
        const selecionada = forma === aparencia.forma;
        const nome = FORMAS_VISUAIS[forma].nome;
        return (
          <Pressable
            key={forma}
            onPress={() => aoEscolher(forma)}
            accessibilityRole="button"
            accessibilityLabel={TEXTOS.cadastro.forma(nome)}
            accessibilityState={{ selected: selecionada }}
            style={[estilos.cartao, selecionada && estilos.selecionado]}
          >
            <DesenhoDaPlanta aparencia={{ ...aparencia, forma }} largura={34} />
            <Text style={estilos.nome} numberOfLines={1}>
              {nome}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  linha: { gap: ESPACO.curto, paddingHorizontal: ESPACO.amplo },
  cartao: {
    width: 62,
    alignItems: 'center',
    paddingTop: ESPACO.curto,
    paddingBottom: ESPACO.minimo,
    gap: ESPACO.fino,
    borderRadius: RAIO.medio,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: CORES.superficie,
  },
  selecionado: { borderColor: CORES.acao },
  nome: { fontFamily: FONTES.forte, fontSize: 9.5, color: CORES.textoDoPapel },
});

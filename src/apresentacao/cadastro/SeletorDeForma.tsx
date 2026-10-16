import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Aparencia, FORMAS, IdForma } from '@/dominio/modelos/Aparencia';
import { DesenhoDaPlanta } from '../ilustracao/DesenhoDaPlanta';
import { FORMAS_VISUAIS } from '../ilustracao/paletas';
import { CORES } from '../tema/cores';
import { ESPACO, RAIO } from '../tema/medidas';
import { FONTES } from '../tema/tipografia';

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
            accessibilityLabel={`Forma: ${nome}`}
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
  linha: { gap: 6, paddingHorizontal: ESPACO.amplo },
  cartao: {
    width: 62,
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 5,
    gap: 2,
    borderRadius: RAIO.medio,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: CORES.superficie,
  },
  selecionado: { borderColor: CORES.acao },
  nome: { fontFamily: FONTES.forte, fontSize: 9.5, color: CORES.textoDoPapel },
});

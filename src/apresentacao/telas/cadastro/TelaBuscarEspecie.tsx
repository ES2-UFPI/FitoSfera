import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { CabecalhoDoCadastro } from '../../cadastro/CabecalhoDoCadastro';
import { FundoAconchegante } from '../../componentes/FundoAconchegante';
import { useAplicativo } from '../../contextos/ContextoDoAplicativo';
import { useRascunho } from '../../contextos/RascunhoDoCadastro';
import { CORES } from '../../tema/cores';
import { ESPACO, RAIO } from '../../tema/medidas';
import { FONTES, TEXTO } from '../../tema/tipografia';

/** Passo 1 do cadastro: achar a espécie no catálogo pelo nome. */
export function TelaBuscarEspecie() {
  const { container } = useAplicativo();
  const { escolherEspecie } = useRascunho();
  const navegador = useRouter();
  const margens = useSafeAreaInsets();
  const [termo, definirTermo] = useState('');
  const [resultados, definirResultados] = useState<readonly EspecieVegetal[] | null>(null);

  useEffect(() => {
    // Só a busca do termo atual vale: uma resposta atrasada (termo já trocado, tela já fechada) é ignorada.
    let atual = true;
    void container.pesquisarEspecies.executar(termo).then((lista) => {
      if (atual) definirResultados(lista);
    });
    return () => {
      atual = false;
    };
  }, [container, termo]);

  function escolher(especie: EspecieVegetal) {
    escolherEspecie(especie);
    navegador.push('/cadastro/aparencia');
  }

  return (
    <FundoAconchegante style={{ paddingTop: margens.top + ESPACO.pequeno }}>
      <CabecalhoDoCadastro passoAtual={1} />
      <Text style={[TEXTO.subtitulo, estilos.titulo]} accessibilityRole="header">
        Qual planta você quer cadastrar?
      </Text>

      <View style={estilos.campo}>
        <Svg width={18} height={18} viewBox="0 0 18 18">
          <Circle cx={7.5} cy={7.5} r={5.5} stroke={CORES.rotulo} strokeWidth={2} fill="none" />
          <Path d="M11.8 11.8 L16 16" stroke={CORES.rotulo} strokeWidth={2} strokeLinecap="round" />
        </Svg>
        <TextInput
          value={termo}
          onChangeText={definirTermo}
          placeholder="Nome da planta"
          placeholderTextColor={CORES.abaInativa}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          style={estilos.entrada}
        />
      </View>

      <FlatList
        data={resultados ?? []}
        keyExtractor={(especie) => especie.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[estilos.lista, { paddingBottom: margens.bottom + ESPACO.folgado }]}
        ItemSeparatorComponent={() => <View style={estilos.divisoria} />}
        ListEmptyComponent={
          resultados !== null && termo.trim() !== '' ? (
            <Text style={[TEXTO.corpo, estilos.semResultado]}>Não encontramos essa planta no catálogo.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            testID="resultado-especie"
            onPress={() => escolher(item)}
            accessibilityRole="button"
            accessibilityLabel={item.nomeComum}
            style={({ pressed }) => [estilos.resultado, pressed && estilos.pressionado]}
          >
            <View style={estilos.nomes}>
              <Text testID="nome-comum" style={estilos.nomeComum}>
                {item.nomeComum}
              </Text>
              <Text style={estilos.nomeCientifico}>{item.nomeCientifico}</Text>
            </View>
            <Svg width={14} height={14} viewBox="0 0 14 14">
              <Path
                d="M5 2 L10 7 L5 12"
                stroke={CORES.rotulo}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        )}
      />
    </FundoAconchegante>
  );
}

const estilos = StyleSheet.create({
  titulo: { paddingHorizontal: ESPACO.amplo, marginTop: ESPACO.medio },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACO.pequeno,
    marginHorizontal: ESPACO.amplo,
    marginTop: ESPACO.grande,
    paddingHorizontal: ESPACO.medio + 2,
    minHeight: 50,
    borderRadius: RAIO.medio,
    borderWidth: 1.5,
    borderColor: CORES.bordaSuave,
    backgroundColor: CORES.superficie,
  },
  entrada: { flex: 1, fontFamily: FONTES.texto, fontSize: 15, color: CORES.texto, paddingVertical: ESPACO.medio },
  lista: { paddingHorizontal: ESPACO.amplo, paddingTop: ESPACO.medio },
  divisoria: { height: 1, backgroundColor: CORES.bordaSuave },
  resultado: { flexDirection: 'row', alignItems: 'center', minHeight: 58, paddingVertical: ESPACO.pequeno },
  pressionado: { opacity: 0.6 },
  nomes: { flex: 1, gap: 1 },
  nomeComum: { fontFamily: FONTES.forte, fontSize: 15.5, color: CORES.texto },
  nomeCientifico: { fontFamily: FONTES.italico, fontSize: 12.5, color: CORES.textoApoio },
  semResultado: { textAlign: 'center', marginTop: ESPACO.folgado },
});

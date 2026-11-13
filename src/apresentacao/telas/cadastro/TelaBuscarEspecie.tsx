import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { TEXTOS } from '@/textos';
import { CabecalhoDoCadastro } from '../../cadastro/CabecalhoDoCadastro';
import { CRITERIOS_DO_MODO, ModoDaBusca, SeletorDaBusca } from '../../cadastro/SeletorDaBusca';
import { APRESENTACAO_DA_DIFICULDADE, observacaoDaDificuldade } from '../../componentes/textosDaDificuldade';
import { FundoAconchegante } from '../../componentes/FundoAconchegante';
import { SeloDeDificuldade } from '../../componentes/SeloDeDificuldade';
import { useAplicativo } from '../../contextos/ContextoDoAplicativo';
import { useRascunho } from '../../contextos/RascunhoDoCadastro';
import { CORES } from '../../tema/cores';
import { ESPACO, RAIO } from '../../tema/medidas';
import { FONTES, TEXTO } from '../../tema/tipografia';

export const ATRASO_DA_BUSCA_MS = 300;

/** Passo 1 do cadastro: achar a espécie no catálogo pelo nome. */
export function TelaBuscarEspecie() {
  const { container } = useAplicativo();
  const { escolherEspecie } = useRascunho();
  const navegador = useRouter();
  const margens = useSafeAreaInsets();
  const [termo, definirTermo] = useState('');
  /** O termo que já valeu o debounce. Separado de `termo` para a troca de modo não esperar a digitação. */
  const [termoAplicado, definirTermoAplicado] = useState('');
  // A tela abre com as mais fáceis no topo: é o que ajuda quem está decidindo por onde começar.
  const [modo, definirModo] = useState<ModoDaBusca>('mais-faceis-primeiro');
  const [resultados, definirResultados] = useState<readonly EspecieVegetal[] | null>(null);

  // A lista inicial e a limpeza do campo são imediatas; somente a digitação espera o debounce.
  useEffect(() => {
    if (termo.trim() === '') {
      definirTermoAplicado('');
      return;
    }
    const temporizador = setTimeout(() => definirTermoAplicado(termo), ATRASO_DA_BUSCA_MS);
    return () => clearTimeout(temporizador);
  }, [termo]);

  // Trocar de opção responde na hora: o debounce é da digitação, não de toda mudança de estado.
  useEffect(() => {
    let atual = true;
    void container.pesquisarEspecies
      .executar({ termo: termoAplicado, ...CRITERIOS_DO_MODO[modo] })
      .then((lista) => {
        // Só a busca atual vale: respostas atrasadas e telas fechadas são ignoradas.
        if (atual) definirResultados(lista);
      });

    return () => {
      atual = false;
    };
  }, [container, termoAplicado, modo]);

  /**
   * Com o filtro ligado, a culpa da lista vazia é dele, e dizer "não encontramos essa planta" seria falso: a
   * planta existe, o filtro é que a esconde. Sem filtro, só o termo buscado explica a lista vazia — o
   * catálogo inteiro nunca vem vazio.
   */
  const vazio =
    resultados === null || resultados.length > 0
      ? null
      : modo === 'faceis'
        ? TEXTOS.cadastro.nenhumaFacil
        : termoAplicado.trim() !== ''
          ? TEXTOS.cadastro.plantaForaDoCatalogo
          : null;

  function escolher(especie: EspecieVegetal) {
    escolherEspecie(especie);
    navegador.push('/cadastro/aparencia');
  }

  return (
    <FundoAconchegante style={{ paddingTop: margens.top + ESPACO.pequeno }}>
      <CabecalhoDoCadastro passoAtual={1} />
      <Text style={[TEXTO.subtitulo, estilos.titulo]} accessibilityRole="header">
        {TEXTOS.cadastro.qualPlanta}
      </Text>

      <View style={estilos.campo}>
        <Svg width={18} height={18} viewBox="0 0 18 18">
          <Circle cx={7.5} cy={7.5} r={5.5} stroke={CORES.rotulo} strokeWidth={2} fill="none" />
          <Path d="M11.8 11.8 L16 16" stroke={CORES.rotulo} strokeWidth={2} strokeLinecap="round" />
        </Svg>
        <TextInput
          value={termo}
          onChangeText={definirTermo}
          placeholder={TEXTOS.cadastro.nomeDaPlanta}
          placeholderTextColor={CORES.abaInativa}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          style={estilos.entrada}
        />
      </View>

      <SeletorDaBusca modo={modo} aoEscolher={definirModo} />

      <FlatList
        data={resultados ?? []}
        keyExtractor={(especie) => especie.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[estilos.lista, { paddingBottom: margens.bottom + ESPACO.folgado }]}
        ItemSeparatorComponent={() => <View style={estilos.divisoria} />}
        ListEmptyComponent={
          vazio === null ? null : <Text style={[TEXTO.corpo, estilos.semResultado]}>{vazio}</Text>
        }
        renderItem={({ item }) => {
          const dificuldade = APRESENTACAO_DA_DIFICULDADE[item.nivelDeDificuldade];
          const observacao = observacaoDaDificuldade(item.nivelDeDificuldade, {
            ...item,
            exigencias: item.exigencias ?? null,
          });
          // "Nome. Estado.", como a etiqueta da estante: o nível é informação, não enfeite, e precisa ser falado.
          const falado = observacao?.falado ?? `${dificuldade.falado}.`;
          return (
            <Pressable
              testID="resultado-especie"
              onPress={() => escolher(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.nomeComum}. ${falado}`}
              style={({ pressed }) => [estilos.resultado, pressed && estilos.pressionado]}
            >
              <View style={estilos.nomes}>
                <View style={estilos.linhaDoNome}>
                  <Text testID="nome-comum" style={estilos.nomeComum}>
                    {item.nomeComum}
                  </Text>
                  <SeloDeDificuldade nivel={item.nivelDeDificuldade} />
                </View>
                <Text style={estilos.nomeCientifico}>{item.nomeCientifico}</Text>
                {observacao !== null && (
                  <View testID="observacao-dificuldade" style={estilos.motivos}>
                    {observacao.itens.map((motivo) => (
                      <View key={motivo} style={estilos.motivo}>
                        <Text style={estilos.marcador}>•</Text>
                        <Text testID="motivo-da-dificuldade" style={estilos.textoDoMotivo}>
                          {motivo}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
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
          );
        }}
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
  resultado: { flexDirection: 'row', alignItems: 'center', minHeight: 58, paddingVertical: ESPACO.medio },
  pressionado: { opacity: 0.6 },
  nomes: { flex: 1, gap: 1 },
  linhaDoNome: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.pequeno },
  nomeComum: { fontFamily: FONTES.forte, fontSize: 15.5, color: CORES.texto, flexShrink: 1 },
  motivos: { marginTop: ESPACO.minimo },
  motivo: { flexDirection: 'row', gap: ESPACO.minimo + 2 },
  marcador: { fontFamily: FONTES.texto, fontSize: 12, lineHeight: 16, color: CORES.textoApoio },
  /** O `flex: 1` deixa a linha que quebra alinhada com o texto, e não embaixo do marcador. */
  textoDoMotivo: { flex: 1, fontFamily: FONTES.texto, fontSize: 12, lineHeight: 16, color: CORES.textoApoio },
  nomeCientifico: { fontFamily: FONTES.italico, fontSize: 12.5, color: CORES.textoApoio },
  semResultado: { textAlign: 'center', marginTop: ESPACO.folgado },
});

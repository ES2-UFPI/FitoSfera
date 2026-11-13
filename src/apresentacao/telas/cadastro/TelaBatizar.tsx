import { Redirect, useRouter } from 'expo-router';
import { useEffect , useRef , useState  } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIMITE_DO_APELIDO } from '@/dominio/modelos/Planta';
import { TEXTOS } from '@/textos';
import { CabecalhoDoCadastro } from '../../cadastro/CabecalhoDoCadastro';
import { VitrineDaPlanta } from '../../cadastro/VitrineDaPlanta';
import { BotaoPrincipal } from '../../componentes/BotaoPrincipal';
import { FundoAconchegante } from '../../componentes/FundoAconchegante';
import { useAplicativo } from '../../contextos/ContextoDoAplicativo';
import { useRascunho } from '../../contextos/RascunhoDoCadastro';
import { escreverDataDePlantio, lerDataDePlantio } from '../../colheita/entradaDePlantio';
import { CORES } from '../../tema/cores';
import { ESPACO, RAIO } from '../../tema/medidas';
import { FONTES, TEXTO } from '../../tema/tipografia';

const ESPERA_DA_CONFIRMACAO = 1200

type EstadodoCadastro = 
  |{tipo: 'ocioso' }
  |{tipo: 'salvando'}
  |{tipo: 'sucesso'; apelidoSalvo: string }
  |{tipo: 'erro'};

type ModoDoPlantio = 'hoje' | 'data' | 'desconhecida';


/** Passo 3 do cadastro: dar um apelido e colocar a planta na estante. */
export function TelaBatizar() {
  const { especie, aparencia, edicao } = useRascunho();
  const { container, recarregarJardim, idJardimSelecionado } = useAplicativo();
  const navegador = useRouter();
  const margens = useSafeAreaInsets();
  const [apelido, definirApelido] = useState(edicao?.apelido ?? especie?.nomeComum ?? '');
  const [modoDoPlantio, definirModoDoPlantio] = useState<ModoDoPlantio>(
    edicao ? (edicao.plantadaEm ? 'data' : 'desconhecida') : 'hoje',
  );
  const [dataDoPlantio, definirDataDoPlantio] = useState(() =>
    edicao?.plantadaEm ? escreverDataDePlantio(edicao.plantadaEm) : escreverDataDePlantio(container.relogio.agora()),
  );
  const [colheitaIniciada, definirColheitaIniciada] = useState(edicao?.colheitaIniciada ?? false);
  const [inicioDaFloracao, definirInicioDaFloracao] = useState(() =>
    edicao?.floracaoIniciadaEm ? escreverDataDePlantio(edicao.floracaoIniciadaEm) : '',
  );
  const [estado, definirEstado] = useState<EstadodoCadastro>({ tipo: 'ocioso' });
  // O estado só atualiza no próximo render; a ref barra o segundo toque que chega no mesmo instante.
  const salvandoAgora = useRef(false);

  useEffect(() => {
    if (estado.tipo !== 'sucesso') return;
    const temporizador = setTimeout(() => navegador.dismissTo('/'), ESPERA_DA_CONFIRMACAO);
    return () => clearTimeout(temporizador);
  }, [estado.tipo, navegador]);

  if (especie === null && edicao === null) return <Redirect href="/cadastro" />;
  const nomeDaEspecie = especie?.nomeComum ?? especie?.nomeComum ?? '';

  const tamanho = Array.from(apelido.trim()).length;
  const valido = tamanho > 0 && tamanho <= LIMITE_DO_APELIDO;
  const dataInformada = lerDataDePlantio(dataDoPlantio, container.relogio.agora());
  const dataDoPlantioValida = !especie?.frutifera || modoDoPlantio !== 'data' || dataInformada !== 'invalida';
  const floracaoInformada = lerDataDePlantio(inicioDaFloracao, container.relogio.agora());
  const dataDeFloracaoValida = !colheitaIniciada || inicioDaFloracao.trim() === '' || floracaoInformada !== 'invalida';
  const emAndamento = estado.tipo === 'salvando' || estado.tipo === 'sucesso';

  async function colocarNaEstante() {
    if (!valido || !dataDoPlantioValida || !dataDeFloracaoValida || salvandoAgora.current) return;
    salvandoAgora.current = true;
    definirEstado({ tipo: 'salvando' });
    try {
      if (edicao) {
        await container.editarPlanta.executar(edicao.idPlanta, {
          apelido,
          aparencia,
          ...(especie?.frutifera
            ? {
                plantadaEm:
                  modoDoPlantio === 'hoje'
                    ? container.relogio.agora()
                    : modoDoPlantio === 'data' && dataInformada instanceof Date
                      ? dataInformada
                      : null,
                colheitaIniciada,
                floracaoIniciadaEm: colheitaIniciada && floracaoInformada instanceof Date ? floracaoInformada : null,
              }
            : {}),
        });
        await recarregarJardim();
        navegador.dismissTo({ pathname: '/planta/[id]', params: { id: edicao.idPlanta } });
      } else if (especie) {
        const planta = await container.cadastrarPlanta.executar({
          idEspecie: especie.id,
          apelido,
          aparencia,
          idJardim: idJardimSelecionado,
          plantadaEm:
            modoDoPlantio === 'hoje'
              ? container.relogio.agora()
              : modoDoPlantio === 'data' && dataInformada instanceof Date
                ? dataInformada
                : null,
          colheitaIniciada,
          floracaoIniciadaEm: colheitaIniciada && floracaoInformada instanceof Date ? floracaoInformada : null,
        });
        await recarregarJardim();
        // O apelido vem da planta gravada: é ele que o domínio aparou e guardou na etiqueta.
        definirEstado({ tipo: 'sucesso', apelidoSalvo: planta.apelido });
      }
    } catch {
      definirEstado({ tipo: 'erro' });
      salvandoAgora.current = false;
    }
  }

  return (
    <FundoAconchegante style={{ paddingTop: margens.top + ESPACO.pequeno }}>
      <KeyboardAvoidingView style={estilos.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <CabecalhoDoCadastro passoAtual={edicao ? undefined : 3} />
        <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <Text style={[TEXTO.subtitulo, estilos.titulo]} accessibilityRole="header">
            {TEXTOS.cadastro.comoVaiChamar}
          </Text>
          <VitrineDaPlanta aparencia={aparencia} etiqueta={apelido.trim() || nomeDaEspecie} />

          <View style={estilos.campo}>
            <TextInput
              value={apelido}
              onChangeText={definirApelido}
              editable={!emAndamento}
              accessibilityLabel={TEXTOS.cadastro.apelidoDaPlanta}
              placeholder={nomeDaEspecie}
              placeholderTextColor={CORES.abaInativa}
              autoCapitalize="sentences"
              returnKeyType="done"
              onSubmitEditing={() => void colocarNaEstante()}
              style={estilos.entrada}
            />
          </View>
          {especie?.frutifera ? (
            <View style={estilos.plantio}>
              <Text style={TEXTO.rotulo}>{TEXTOS.cadastro.idadeDaMuda}</Text>
              <View accessibilityRole="radiogroup" style={estilos.opcoesDoPlantio}>
                {([
                  ['hoje', TEXTOS.cadastro.mudaPlantadaHoje],
                  ['data', TEXTOS.cadastro.informarDataDoPlantio],
                  ['desconhecida', TEXTOS.cadastro.idadeDesconhecida],
                ] as const).map(([modo, rotulo]) => (
                  <Pressable
                    key={modo}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: modoDoPlantio === modo }}
                    accessibilityLabel={rotulo}
                    onPress={() => definirModoDoPlantio(modo)}
                    style={estilos.opcaoDoPlantio}
                  >
                    <View style={[estilos.radio, modoDoPlantio === modo && estilos.radioSelecionado]} />
                    <Text style={TEXTO.corpo}>{rotulo}</Text>
                  </Pressable>
                ))}
              </View>
              {modoDoPlantio === 'data' ? (
                <View style={[estilos.campo, !dataDoPlantioValida && estilos.campoComErro]}>
                  <TextInput
                    value={dataDoPlantio}
                    onChangeText={definirDataDoPlantio}
                    accessibilityLabel={TEXTOS.cadastro.dataDoPlantio}
                    placeholder={TEXTOS.cadastro.formatoDaDataDoPlantio}
                    placeholderTextColor={CORES.abaInativa}
                    keyboardType="numbers-and-punctuation"
                    editable={!emAndamento}
                    style={estilos.entrada}
                  />
                </View>
              ) : null}
              {!dataDoPlantioValida ? (
                <Text style={[estilos.textoDeAjuda, estilos.erro]} accessibilityRole="alert">
                  {TEXTOS.cadastro.dataDoPlantioInvalida}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: colheitaIniciada }}
                accessibilityLabel={TEXTOS.cadastro.colheitaJaIniciada}
                onPress={() => definirColheitaIniciada((atual) => !atual)}
                style={estilos.opcaoDoPlantio}
              >
                <View style={[estilos.radio, colheitaIniciada && estilos.radioSelecionado]} />
                <Text style={TEXTO.corpo}>{TEXTOS.cadastro.colheitaJaIniciada}</Text>
              </Pressable>
              {colheitaIniciada ? (
                <View style={estilos.dataFloracao}>
                  <Text style={TEXTO.rotulo}>{TEXTOS.cadastro.inicioDaFloracao}</Text>
                  <View style={[estilos.campo, !dataDeFloracaoValida && estilos.campoComErro]}>
                    <TextInput
                      value={inicioDaFloracao}
                      onChangeText={definirInicioDaFloracao}
                      accessibilityLabel={TEXTOS.cadastro.inicioDaFloracao}
                      placeholder={TEXTOS.cadastro.formatoDaDataDoPlantio}
                      placeholderTextColor={CORES.abaInativa}
                      keyboardType="numbers-and-punctuation"
                      editable={!emAndamento}
                      style={estilos.entrada}
                    />
                  </View>
                  <Text style={estilos.textoDeAjuda}>{TEXTOS.cadastro.ajudaDoInicioDaFloracao}</Text>
                  {!dataDeFloracaoValida ? (
                    <Text style={[estilos.textoDeAjuda, estilos.erro]} accessibilityRole="alert">
                      {TEXTOS.cadastro.dataDoPlantioInvalida}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}
          <View style={estilos.ajuda}>
            <MensagemDoCampo estado={estado} />
            <Text style={[estilos.textoDeAjuda, tamanho > LIMITE_DO_APELIDO && estilos.erro]}>
              {tamanho}/{LIMITE_DO_APELIDO}
            </Text>
          </View>
        </ScrollView>
        <View style={[estilos.rodape, { paddingBottom: margens.bottom + ESPACO.grande }]}>
          <BotaoPrincipal
            titulo={edicao ? TEXTOS.cadastro.salvarAlteracoes : TEXTOS.cadastro.colocarNaEstante}
            largo
            desabilitado={!valido || !dataDoPlantioValida || !dataDeFloracaoValida || emAndamento}
            aoTocar={() => void colocarNaEstante()}
          />
        </View>
      </KeyboardAvoidingView>
    </FundoAconchegante>
  );
}

function MensagemDoCampo({ estado }: { estado: EstadodoCadastro }) {
  if(estado.tipo === 'sucesso'){
    return (
      <Text style={[estilos.textoDeAjuda, estilos.confirmacao]} accessibilityLiveRegion='polite'>
        {TEXTOS.cadastro.entrouNaEstante(estado.apelidoSalvo)}
      </Text>
    );
  }
  if(estado.tipo === 'erro'){
    return (
      <Text style={[estilos.textoDeAjuda, estilos.erro]} accessibilityRole='alert'>
        {TEXTOS.cadastro.falhaAoSalvar}
      </Text>
    )
  }
  return <Text style = {estilos.textoDeAjuda}>{TEXTOS.cadastro.ajudaDoApelido}</Text>
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { paddingBottom: ESPACO.folgado },
  titulo: { paddingHorizontal: ESPACO.amplo, marginTop: ESPACO.medio },
  campo: {
    marginHorizontal: ESPACO.amplo,
    marginTop: ESPACO.folgado,
    paddingHorizontal: ESPACO.grande,
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: RAIO.medio,
    borderWidth: 1.5,
    borderColor: CORES.bordaSuave,
    backgroundColor: CORES.superficie,
  },
  campoComErro: { borderColor: CORES.erro },
  plantio: { marginHorizontal: ESPACO.amplo, marginTop: ESPACO.grande, gap: ESPACO.pequeno },
  dataFloracao: { gap: ESPACO.pequeno },
  opcoesDoPlantio: { gap: ESPACO.pequeno },
  opcaoDoPlantio: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.pequeno, minHeight: 44 },
  radio: { width: 18, height: 18, borderRadius: RAIO.pilula, borderWidth: 1.5, borderColor: CORES.bordaSuave },
  radioSelecionado: { backgroundColor: CORES.acao, borderColor: CORES.acao },
  entrada: { fontFamily: FONTES.forte, fontSize: 16, color: CORES.texto, paddingVertical: ESPACO.medio },
  ajuda: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ESPACO.medio,
    marginHorizontal: ESPACO.amplo,
    marginTop: ESPACO.pequeno,
  },
  textoDeAjuda: { ...TEXTO.apoio, flexShrink: 1 },
  confirmacao : {color: CORES.texto},
  erro: { color: CORES.erro },
  rodape: { paddingHorizontal: ESPACO.amplo, paddingTop: ESPACO.medio },
});

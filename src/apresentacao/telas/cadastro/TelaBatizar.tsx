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
import { formatarDataLocal, lerDataLocalNaoFutura } from '../../colheita/entradaDeDataLocal';
import { mascararData } from '../../mascaraDeData';
import { CORES, ESPACO, FONTES, RAIO, TEXTO } from '../../tema';

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
  const { container, recarregarJardim, idJardimSelecionado, avisarEdicaoSalva } = useAplicativo();
  const navegador = useRouter();
  const margens = useSafeAreaInsets();
  const [apelido, definirApelido] = useState(edicao?.apelido ?? especie?.nomeComum ?? '');
  const [modoDoPlantio, definirModoDoPlantio] = useState<ModoDoPlantio>(
    edicao ? (edicao.plantadaEm ? 'data' : 'desconhecida') : 'hoje',
  );
  const [dataDoPlantio, definirDataDoPlantio] = useState(() =>
    edicao?.plantadaEm ? formatarDataLocal(edicao.plantadaEm) : formatarDataLocal(container.relogio.agora()),
  );
  // No cadastro a pergunta começa sem resposta (null) e precisa ser respondida; na edição, vem a da planta.
  const [respostaDaProducao, definirRespostaDaProducao] = useState<boolean | null>(edicao ? edicao.colheitaIniciada : null);
  // Uma muda plantada hoje ainda não produz: a pergunta nem aparece, e a resposta é "não".
  const mudaDeHoje = modoDoPlantio === 'hoje';
  const colheitaIniciada = !mudaDeHoje && respostaDaProducao === true;
  const [inicioDaFloracao, definirInicioDaFloracao] = useState(() =>
    edicao?.floracaoIniciadaEm ? formatarDataLocal(edicao.floracaoIniciadaEm) : '',
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
  const dataInformada = lerDataLocalNaoFutura(dataDoPlantio, container.relogio.agora());
  const dataDoPlantioValida = !especie?.frutifera || modoDoPlantio !== 'data' || dataInformada !== 'invalida';
  const floracaoInformada = lerDataLocalNaoFutura(inicioDaFloracao, container.relogio.agora());
  const plantio =
    modoDoPlantio === 'hoje' ? container.relogio.agora() : modoDoPlantio === 'data' && dataInformada instanceof Date ? dataInformada : null;
  // Só o dia conta: o plantio "hoje" leva a hora de agora, e a floração digitada é meia-noite.
  const floracaoAntesDoPlantio =
    colheitaIniciada &&
    floracaoInformada instanceof Date &&
    plantio !== null &&
    floracaoInformada.getTime() < new Date(plantio.getFullYear(), plantio.getMonth(), plantio.getDate()).getTime();
  const dataDeFloracaoValida =
    !colheitaIniciada || inicioDaFloracao.trim() === '' || (floracaoInformada !== 'invalida' && !floracaoAntesDoPlantio);
  const producaoRespondida = !especie?.frutifera || mudaDeHoje || respostaDaProducao !== null;
  const emAndamento = estado.tipo === 'salvando' || estado.tipo === 'sucesso';
  const podeSalvar = valido && dataDoPlantioValida && dataDeFloracaoValida && producaoRespondida;

  async function colocarNaEstante() {
    if (!podeSalvar || salvandoAgora.current) return;
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
        avisarEdicaoSalva(edicao.idPlanta);
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
          {/* A dica e o contador são do apelido: ficam colados ao campo, e não no fim da tela. */}
          <View style={estilos.ajuda}>
            <MensagemDoCampo estado={estado} />
            <Text style={[estilos.textoDeAjuda, tamanho > LIMITE_DO_APELIDO && estilos.erro]}>
              {tamanho}/{LIMITE_DO_APELIDO}
            </Text>
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
                <View style={[estilos.campo, estilos.campoDentroDaPergunta, !dataDoPlantioValida && estilos.campoComErro]}>
                  <TextInput
                    value={dataDoPlantio}
                    onChangeText={(texto) => definirDataDoPlantio(mascararData(texto))}
                    accessibilityLabel={TEXTOS.cadastro.dataDoPlantio}
                    placeholder={TEXTOS.cadastro.formatoDaDataDoPlantio}
                    placeholderTextColor={CORES.abaInativa}
                    keyboardType="number-pad"
                    maxLength={10}
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
            </View>
          ) : null}
          {especie?.frutifera && !mudaDeHoje ? (
            <View style={estilos.plantio}>
              <Text style={TEXTO.rotulo}>{TEXTOS.cadastro.jaEstaProduzindo}</Text>
              <View accessibilityRole="radiogroup" style={estilos.opcoesDaProducao}>
                {([
                  [true, TEXTOS.cadastro.sim, TEXTOS.cadastro.simJaProduz],
                  [false, TEXTOS.cadastro.nao, TEXTOS.cadastro.naoProduzAinda],
                ] as const).map(([resposta, rotulo, rotuloFalado]) => (
                  <Pressable
                    key={rotulo}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: respostaDaProducao === resposta }}
                    accessibilityLabel={rotuloFalado}
                    onPress={() => definirRespostaDaProducao(resposta)}
                    style={estilos.opcaoDoPlantio}
                  >
                    <View style={[estilos.radio, respostaDaProducao === resposta && estilos.radioSelecionado]} />
                    <Text style={TEXTO.corpo}>{rotulo}</Text>
                  </Pressable>
                ))}
              </View>
              {respostaDaProducao === null ? (
                <Text style={estilos.textoDeAjuda}>{TEXTOS.cadastro.respondaSeProduz}</Text>
              ) : null}
              {colheitaIniciada ? (
                <View style={estilos.dataFloracao}>
                  <Text style={TEXTO.rotulo}>{TEXTOS.cadastro.inicioDaFloracao}</Text>
                  <View style={[estilos.campo, estilos.campoDentroDaPergunta, !dataDeFloracaoValida && estilos.campoComErro]}>
                    <TextInput
                      value={inicioDaFloracao}
                      onChangeText={(texto) => definirInicioDaFloracao(mascararData(texto))}
                      accessibilityLabel={TEXTOS.cadastro.inicioDaFloracao}
                      placeholder={TEXTOS.cadastro.formatoDaDataDoPlantio}
                      placeholderTextColor={CORES.abaInativa}
                      keyboardType="number-pad"
                      maxLength={10}
                      editable={!emAndamento}
                      style={estilos.entrada}
                    />
                  </View>
                  <Text style={estilos.textoDeAjuda}>
                    {edicao ? TEXTOS.cadastro.ajudaDoInicioDaFloracao : TEXTOS.cadastro.ajudaDoInicioDaFloracaoNoCadastro}
                  </Text>
                  {!dataDeFloracaoValida ? (
                    <Text style={[estilos.textoDeAjuda, estilos.erro]} accessibilityRole="alert">
                      {floracaoAntesDoPlantio ? TEXTOS.cadastro.floracaoAntesDoPlantio : TEXTOS.cadastro.dataDoPlantioInvalida}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
        <View style={[estilos.rodape, { paddingBottom: margens.bottom + ESPACO.grande }]}>
          <BotaoPrincipal
            titulo={edicao ? TEXTOS.cadastro.salvarAlteracoes : TEXTOS.cadastro.colocarNaEstante}
            largo
            desabilitado={!podeSalvar || emAndamento}
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
  /** A pergunta já tem a margem lateral; o campo dentro dela não soma outra. */
  campoDentroDaPergunta: { marginHorizontal: 0, marginTop: ESPACO.pequeno },
  plantio: { marginHorizontal: ESPACO.amplo, marginTop: ESPACO.grande, gap: ESPACO.pequeno },
  dataFloracao: { gap: ESPACO.pequeno },
  opcoesDoPlantio: { gap: ESPACO.pequeno },
  opcoesDaProducao: { flexDirection: 'row', gap: ESPACO.folgado },
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

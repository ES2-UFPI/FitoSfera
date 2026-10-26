import { Redirect, useRouter } from 'expo-router';
import { useEffect , useRef , useState  } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIMITE_DO_APELIDO } from '@/dominio/modelos/Planta';
import { CabecalhoDoCadastro } from '../../cadastro/CabecalhoDoCadastro';
import { VitrineDaPlanta } from '../../cadastro/VitrineDaPlanta';
import { BotaoPrincipal } from '../../componentes/BotaoPrincipal';
import { FundoAconchegante } from '../../componentes/FundoAconchegante';
import { useAplicativo } from '../../contextos/ContextoDoAplicativo';
import { useRascunho } from '../../contextos/RascunhoDoCadastro';
import { CORES } from '../../tema/cores';
import { ESPACO, RAIO } from '../../tema/medidas';
import { FONTES, TEXTO } from '../../tema/tipografia';

const ESPERA_DA_CONFIRMACAO = 1200

type EstadodoCadastro = 
  |{tipo: 'ocioso' }
  |{tipo: 'salvando'}
  |{tipo: 'sucesso'; apelidoSalvo: string }
  |{tipo: 'erro'};


/** Passo 3 do cadastro: dar um apelido e colocar a planta na estante. */
export function TelaBatizar() {
  const { especie, aparencia, edicao } = useRascunho();
  const { container, recarregarJardim, idJardimSelecionado } = useAplicativo();
  const navegador = useRouter();
  const margens = useSafeAreaInsets();
  const [apelido, definirApelido] = useState(edicao?.apelido ?? especie?.nomeComum ?? '');
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
  const emAndamento = estado.tipo === 'salvando' || estado.tipo === 'sucesso';

  async function colocarNaEstante() {
    if (!valido || salvandoAgora.current) return;
    salvandoAgora.current = true;
    definirEstado({ tipo: 'salvando' });
    try {
      if (edicao) {
        await container.editarPlanta.executar(edicao.idPlanta, { apelido, aparencia });
        await recarregarJardim();
        navegador.dismissTo({ pathname: '/planta/[id]', params: { id: edicao.idPlanta } });
      } else if (especie) {
        const planta = await container.cadastrarPlanta.executar({ idEspecie: especie.id, apelido, aparencia, idJardim: idJardimSelecionado });
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
            Como você vai chamar esta planta?
          </Text>
          <VitrineDaPlanta aparencia={aparencia} etiqueta={apelido.trim() || nomeDaEspecie} />

          <View style={estilos.campo}>
            <TextInput
              value={apelido}
              onChangeText={definirApelido}
              editable={!emAndamento}
              accessibilityLabel="Apelido da planta"
              placeholder={nomeDaEspecie}
              placeholderTextColor={CORES.abaInativa}
              autoCapitalize="sentences"
              returnKeyType="done"
              onSubmitEditing={() => void colocarNaEstante()}
              style={estilos.entrada}
            />
          </View>
          <View style={estilos.ajuda}>
            <MensagemDoCampo estado={estado} />
            <Text style={[estilos.textoDeAjuda, tamanho > LIMITE_DO_APELIDO && estilos.erro]}>
              {tamanho}/{LIMITE_DO_APELIDO}
            </Text>
          </View>
        </ScrollView>
        <View style={[estilos.rodape, { paddingBottom: margens.bottom + ESPACO.grande }]}>
          <BotaoPrincipal
            titulo={edicao ? 'Salvar alterações' : 'Colocar na estante'}
            largo
            desabilitado={!valido || emAndamento}
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
        {estado.apelidoSalvo} entrou para a estante!
      </Text>
    );
  }
  if(estado.tipo === 'erro'){
    return (
      <Text style={[estilos.textoDeAjuda, estilos.erro]} accessibilityRole='alert'>
        Ocorreu um erro ao salvar. Tente novamente.
      </Text>
    )
  }
  return <Text style = {estilos.textoDeAjuda}>Esse nome aparece na etiqueta da estante</Text>
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

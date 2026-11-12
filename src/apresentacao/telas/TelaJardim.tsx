import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SensorPareado } from '@/aplicacao/portas/PareamentoDoSensor';
import { TEXTOS } from '@/textos';
import { BotaoFlutuante } from '../componentes/BotaoFlutuante';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { CabecalhoDoJardim } from '../componentes/CabecalhoDoJardim';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { SetaDoDropdown } from '../componentes/SetaDoDropdown';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { Estante } from '../estante/Estante';
import { EstadoVazio } from './EstadoVazio';
import { CORES } from '../tema/cores';
import { ALVO_DE_TOQUE, ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';

export function TelaJardim() {
  const {
    container,
    plantas,
    jardins,
    idJardimSelecionado,
    selecionarJardim,
    criarJardim,
    recarregarJardins,
    recarregarJardim,
  } = useAplicativo();
  const [seletorAberto, definirSeletorAberto] = useState(false);
  const [novoNome, definirNovoNome] = useState('');
  const [erroDoJardim, definirErroDoJardim] = useState(false);
  const [sensores, definirSensores] = useState<readonly SensorPareado[]>([]);
  const [erroDoSensor, definirErroDoSensor] = useState('');
  const [sensorAberto, definirSensorAberto] = useState(false);
  const [atualizandoLeituras, definirAtualizandoLeituras] = useState(false);
  const [erroDaAtualizacao, definirErroDaAtualizacao] = useState(false);
  const temporizadorDoErro = useRef<ReturnType<typeof setTimeout> | null>(null);
  const margens = useSafeAreaInsets();
  const navegador = useRouter();

  useFocusEffect(
    useCallback(() => {
      let ativa = true;
      void recarregarJardim();
      void recarregarJardins().catch(() => {
        if (ativa) definirErroDoJardim(true);
      });
      void container.pareamentoDoSensor?.listarPareados?.().then(
        (lista) => { if (ativa) definirSensores(lista); },
        () => { if (ativa) definirErroDoSensor(TEXTOS.jardim.falhaAoCarregarSensores); },
      );
      return () => { ativa = false; };
    }, [container, recarregarJardim, recarregarJardins]),
  );

  const abrirCadastro = () => navegador.push('/cadastro');
  const abrirPlanta = (id: string) => navegador.push({ pathname: '/planta/[id]', params: { id } });
  const lista = plantas ?? [];
  const jardimAtual = jardins.find((jardim) => jardim.id === idJardimSelecionado);
  const nomeDoJardim = jardimAtual?.nome ?? TEXTOS.comum.jardimPrincipal;
  const sensorSimulado = jardimAtual?.idSensor?.startsWith('simulado') ?? false;
  const sensorFisico = sensores.find((sensor) => sensor.id === jardimAtual?.idSensor);
  const statusDoSensor = sensorSimulado
    ? TEXTOS.jardim.sensorSimuladoEmUso
    : sensorFisico?.nome ?? (jardimAtual?.idSensor ? TEXTOS.jardim.sensorEmUso : TEXTOS.jardim.nenhumSensor);

  useEffect(() => () => {
    if (temporizadorDoErro.current !== null) clearTimeout(temporizadorDoErro.current);
  }, []);

  function mostrarErroDaAtualizacao() {
    if (temporizadorDoErro.current !== null) clearTimeout(temporizadorDoErro.current);
    definirErroDaAtualizacao(true);
    temporizadorDoErro.current = setTimeout(() => {
      temporizadorDoErro.current = null;
      definirErroDaAtualizacao(false);
    }, 4_000);
  }

  async function trocarJardim(id: string) {
    try {
      await selecionarJardim(id);
      definirSeletorAberto(false);
      definirErroDoJardim(false);
    } catch {
      definirErroDoJardim(true);
    }
  }

  async function criar() {
    try {
      await criarJardim(novoNome);
      definirNovoNome('');
      definirSeletorAberto(false);
      definirErroDoJardim(false);
    } catch {
      definirErroDoJardim(true);
    }
  }

  async function atualizarJardimDepoisDaAssociacao() {
    await recarregarJardins();
    await recarregarJardim();
    definirErroDoSensor('');
  }

  async function alterarSensorFisico(idSensor: string | null) {
    try {
      if (idSensor === null) await container.gerenciarJardins.desassociar(idJardimSelecionado);
      else await container.gerenciarJardins.associar(idJardimSelecionado, idSensor);
      await atualizarJardimDepoisDaAssociacao();
    } catch (falha) {
      definirErroDoSensor(falha instanceof Error ? falha.message : TEXTOS.jardim.falhaAoTrocarSensor);
    }
  }

  async function atualizarLeituras() {
    if (atualizandoLeituras) return;
    definirAtualizandoLeituras(true);
    definirErroDaAtualizacao(false);
    try {
      const resultado = await container.atualizarLeituras.executar(idJardimSelecionado);
      await recarregarJardim();
      if (resultado.houveFalha) mostrarErroDaAtualizacao();
    } catch {
      mostrarErroDaAtualizacao();
    } finally {
      definirAtualizandoLeituras(false);
    }
  }

  return (
    <FundoAconchegante style={{ paddingTop: margens.top }}>
        <View style={estilos.cartaoDoJardim}>
          {/* Abre a lista de jardins direto: trocar de jardim fica a dois toques. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={TEXTOS.jardim.trocarOuCriarJardim}
            accessibilityHint={TEXTOS.jardim.jardimAtual(nomeDoJardim)}
            onPress={() => definirSeletorAberto(true)}
            style={({ pressed }) => [estilos.cabecalhoDoCartao, pressed && estilos.cabecalhoPressionado]}
          >
            <View style={estilos.detalheDoCartaoCompacto}>
              <Text style={TEXTO.rotulo}>{TEXTOS.jardim.rotuloDoJardimAtual}</Text>
              <Text style={estilos.nomeDoJardim} numberOfLines={1}>{nomeDoJardim}</Text>
              <Text style={TEXTO.apoio}>{TEXTOS.jardim.plantasNesteEspaco(lista.length)}</Text>
            </View>
            <SetaDoDropdown aberto={seletorAberto} />
          </Pressable>
        </View>

        <View style={estilos.cabecalhoJardim}>
          <CabecalhoDoJardim quantidade={lista.length} />
        </View>

        {container.pareamentoDoSensor || container.controleDoSensorDeDesenvolvimento ? (
          <View style={estilos.cartaoDoSensor}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={sensorAberto ? TEXTOS.jardim.ocultarOpcoesDoSensor : TEXTOS.jardim.mostrarOpcoesDoSensor}
              accessibilityState={{ expanded: sensorAberto }}
              onPress={() => definirSensorAberto((aberto) => !aberto)}
              style={({ pressed }) => [estilos.cabecalhoDoCartao, pressed && estilos.cabecalhoPressionado]}
            >
              <View style={[estilos.pontoDoSensor, (sensorFisico || sensorSimulado) && estilos.pontoAtivo]} />
              <View style={estilos.detalheDoSensor}>
                <Text style={TEXTO.rotulo}>{TEXTOS.jardim.rotuloDoSensor}</Text>
                <Text style={estilos.statusDoSensor} numberOfLines={1}>{statusDoSensor}</Text>
              </View>
              <SetaDoDropdown aberto={sensorAberto} />
            </Pressable>

            {sensorAberto ? (
              <View style={estilos.conteudoDoCartao}>
                <Text style={TEXTO.apoio}>{TEXTOS.jardim.explicacaoDoSensor}</Text>

                {container.pareamentoDoSensor ? (
                  <View style={estilos.acoesDoSensor}>
                    {sensores.map((sensor) => (
                      <BotaoPrincipal
                        key={sensor.id}
                        titulo={(sensor.id === jardimAtual?.idSensor ? TEXTOS.jardim.sensorEmUsoNoJardim : TEXTOS.jardim.usarSensor)(
                      sensor.nome,
                      sensor.id.slice(-5),
                    )}
                        variante="secundaria"
                        largo
                        aoTocar={() => void alterarSensorFisico(sensor.id)}
                      />
                    ))}
                    <BotaoPrincipal titulo={TEXTOS.jardim.parearNovoSensor} variante="secundaria" largo
                      aoTocar={() => navegador.push('/sensor')} />
                    {jardimAtualTemSensorFisico(jardimAtual?.idSensor) ? (
                      <BotaoPrincipal titulo={TEXTOS.jardim.pararDeUsarSensor} variante="secundaria" largo
                        aoTocar={() => void alterarSensorFisico(null)} />
                    ) : null}
                  </View>
                ) : null}

                {erroDoSensor ? <Text style={estilos.erroDoSensor} accessibilityRole="alert">{erroDoSensor}</Text> : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {lista.length > 0 ? (
          <>
            <Estante
              plantas={lista}
              aoAbrirPlanta={abrirPlanta}
              aoCadastrar={abrirCadastro}
              atualizando={atualizandoLeituras}
              aoAtualizar={() => void atualizarLeituras()}
            />
            <BotaoFlutuante aoTocar={abrirCadastro} />
          </>
        ) : null}
        {plantas !== null && plantas.length === 0 ? <EstadoVazio aoComecar={abrirCadastro} /> : null}
      <Modal visible={seletorAberto} transparent animationType="fade" onRequestClose={() => definirSeletorAberto(false)}>
        <Pressable style={estilos.fundoDoModal} onPress={() => definirSeletorAberto(false)} accessible={false}>
          <Pressable style={estilos.modal} accessibilityViewIsModal onPress={() => undefined}>
            <Text style={TEXTO.subtitulo} accessibilityRole="header">{TEXTOS.jardim.seusJardins}</Text>
            <Text style={TEXTO.apoio}>{TEXTOS.jardim.escolhaOJardim}</Text>
            <ScrollView style={estilos.listaDeJardins} showsVerticalScrollIndicator={false}>
              {jardins.map((jardim) => {
                const selecionado = jardim.id === idJardimSelecionado;
                return (
                  <Pressable key={jardim.id} accessibilityRole="button" accessibilityState={{ selected: selecionado }}
                    onPress={() => void trocarJardim(jardim.id)} style={[estilos.opcaoDeJardim, selecionado && estilos.jardimSelecionado]}>
                    <View style={estilos.detalheDaOpcao}>
                      <Text style={estilos.nomeDaOpcao}>{jardim.nome}</Text>
                      <Text style={TEXTO.apoio}>{selecionado ? TEXTOS.jardim.quantidadeDePlantas(lista.length) : TEXTOS.jardim.toqueParaAbrir}</Text>
                    </View>
                    {selecionado ? <Text style={estilos.seloAtual}>{TEXTOS.jardim.seloAtual}</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={TEXTO.rotulo}>{TEXTOS.jardim.rotuloDoNovoJardim}</Text>
            <TextInput accessibilityLabel={TEXTOS.jardim.nomeDoNovoJardim} value={novoNome} onChangeText={definirNovoNome}
              placeholder={TEXTOS.jardim.exemploDeNome} placeholderTextColor={CORES.textoApoio} style={estilos.entrada} />
            {erroDoJardim ? <Text style={estilos.erroDoSensor} accessibilityRole="alert">{TEXTOS.jardim.falhaAoTrocarJardim}</Text> : null}
            <View style={estilos.acoesDoModal}>
              <BotaoPrincipal titulo={TEXTOS.comum.cancelar} variante="secundaria" aoTocar={() => definirSeletorAberto(false)} />
              <BotaoPrincipal titulo={TEXTOS.jardim.criarJardim} aoTocar={() => void criar()} desabilitado={!novoNome.trim()} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      {erroDaAtualizacao ? (
        <View testID="aviso-de-atualizacao" style={estilos.avisoDaAtualizacao} accessibilityRole="alert" accessible>
          <Text style={estilos.textoDoAvisoDaAtualizacao}>{TEXTOS.jardim.falhaAoAtualizarLeituras}</Text>
        </View>
      ) : null}
    </FundoAconchegante>
  );
}

function jardimAtualTemSensorFisico(idSensor: string | null | undefined): boolean {
  return idSensor !== undefined && idSensor !== null && !idSensor.startsWith('simulado');
}

const estilos = StyleSheet.create({
  cartaoDoJardim: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    marginHorizontal: ESPACO.grande,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.grande,
    backgroundColor: CORES.superficie,
    overflow: 'hidden',
  },
  cabecalhoJardim: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  detalheDoCartaoCompacto: { flex: 1, gap: 1 },
  nomeDoJardim: { fontFamily: FONTES.titulo, fontSize: 20, lineHeight: 24, color: CORES.texto },
  cartaoDoSensor: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    marginHorizontal: ESPACO.grande,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.grande,
    backgroundColor: CORES.superficie,
    overflow: 'hidden',
  },
  cabecalhoDoCartao: {
    minHeight: ALVO_DE_TOQUE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACO.medio,
    paddingHorizontal: ESPACO.grande,
    paddingVertical: ESPACO.medio,
  },
  cabecalhoPressionado: { backgroundColor: CORES.papel },
  pontoDoSensor: { width: 11, height: 11, borderRadius: RAIO.pilula, backgroundColor: CORES.statusSemDados },
  pontoAtivo: { backgroundColor: CORES.statusOk },
  detalheDoSensor: { flex: 1, gap: ESPACO.minimo },
  statusDoSensor: { fontFamily: FONTES.forte, fontSize: 14, color: CORES.texto },
  conteudoDoCartao: {
    gap: ESPACO.medio,
    paddingHorizontal: ESPACO.grande,
    paddingBottom: ESPACO.grande,
    borderTopWidth: 1,
    borderTopColor: CORES.bordaSuave,
    paddingTop: ESPACO.medio,
  },
  acoesDoSensor: { gap: ESPACO.pequeno },
  erroDoSensor: { ...TEXTO.apoio, color: CORES.erro },
  avisoDaAtualizacao: {
    position: 'absolute',
    right: ESPACO.grande,
    bottom: ESPACO.grande + ALVO_DE_TOQUE + ESPACO.medio,
    left: ESPACO.grande,
    zIndex: 10,
    elevation: 10,
    padding: ESPACO.medio,
    borderWidth: 1,
    borderColor: CORES.erro,
    borderRadius: RAIO.medio,
    backgroundColor: CORES.superficie,
  },
  textoDoAvisoDaAtualizacao: { ...TEXTO.apoio, color: CORES.erro },
  fundoDoModal: { flex: 1, justifyContent: 'center', padding: ESPACO.grande, backgroundColor: 'rgba(61, 51, 38, 0.48)' },
  modal: { width: '100%', maxWidth: 460, maxHeight: '85%', alignSelf: 'center', padding: ESPACO.folgado,
    gap: ESPACO.medio, borderRadius: RAIO.grande, backgroundColor: CORES.superficie },
  listaDeJardins: { flexGrow: 0, maxHeight: 250 },
  opcaoDeJardim: { minHeight: ALVO_DE_TOQUE + 8, flexDirection: 'row', alignItems: 'center', marginBottom: ESPACO.pequeno,
    padding: ESPACO.medio, borderWidth: 1, borderColor: CORES.bordaSuave, borderRadius: RAIO.medio,
    backgroundColor: CORES.fundoTopo },
  jardimSelecionado: { borderColor: CORES.acao, backgroundColor: CORES.papel },
  detalheDaOpcao: { flex: 1, gap: ESPACO.minimo },
  nomeDaOpcao: { ...TEXTO.corpo, color: CORES.texto, fontFamily: FONTES.forte },
  seloAtual: { ...TEXTO.rotulo, color: CORES.acao },
  entrada: { minHeight: ALVO_DE_TOQUE, paddingHorizontal: ESPACO.medio, borderWidth: 1,
    borderColor: CORES.bordaSuave, borderRadius: RAIO.medio, color: CORES.texto, backgroundColor: CORES.fundoTopo },
  acoesDoModal: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: ESPACO.pequeno },
});

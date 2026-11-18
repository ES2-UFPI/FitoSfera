import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SensorPareado } from '@/aplicacao/portas/PareamentoDoSensor';
import { Jardim, JARDIM_PRINCIPAL } from '@/dominio/modelos/Jardim';
import { TEXTOS } from '@/textos';
import { BotaoFlutuante } from '../componentes/BotaoFlutuante';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { CabecalhoDoJardim } from '../componentes/CabecalhoDoJardim';
import { Cartao } from '../componentes/Cartao';
import { DialogoDeConfirmacao } from '../componentes/DialogoDeConfirmacao';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { SetaDoDropdown } from '../componentes/SetaDoDropdown';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { Estante } from '../estante/Estante';
import { finalDoEndereco } from '../sensor/textosDoSensor';
import { EstadoVazio } from './EstadoVazio';
import { ALVO_DE_TOQUE, CORES, ESPACO, FONTES, LARGURA_DO_CONTEUDO, LARGURA_DO_MODAL, RAIO, TEXTO } from '../tema';

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
  const [plantasPorJardim, definirPlantasPorJardim] = useState<ReadonlyMap<string, number>>(new Map());
  const [atualizandoLeituras, definirAtualizandoLeituras] = useState(false);
  const [erroDaAtualizacao, definirErroDaAtualizacao] = useState(false);
  const temporizadorDoErro = useRef<ReturnType<typeof setTimeout> | null>(null);
  // O jardim aberto para renomear, dentro do seletor; null mostra a lista.
  const [jardimEmEdicao, definirJardimEmEdicao] = useState<Jardim | null>(null);
  const [nomeEditado, definirNomeEditado] = useState('');
  const [erroDaEdicao, definirErroDaEdicao] = useState(false);
  // A exclusão pergunta num diálogo próprio, com o seletor fechado: dois modais abertos se atrapalham.
  const [jardimParaExcluir, definirJardimParaExcluir] = useState<Jardim | null>(null);
  const [exclusaoDoJardim, definirExclusaoDoJardim] = useState<'confirmando' | 'excluindo' | 'erro'>('confirmando');
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

  // A contagem só importa com o seletor aberto, então é lida ao abrir: assim reflete cadastros e exclusões recentes.
  useEffect(() => {
    if (!seletorAberto) return;
    let ativo = true;
    void container.gerenciarJardins.contarPlantas().then(
      (contagem) => { if (ativo) definirPlantasPorJardim(contagem); },
      () => undefined,
    );
    return () => { ativo = false; };
  }, [container, seletorAberto]);

  function textoDaQuantidade(idJardim: string) {
    // O jardim aberto usa a estante, que é a lista mais nova; os outros, a contagem lida ao abrir o seletor.
    const quantidade = quantidadeDePlantas(idJardim);
    return quantidade === 0 ? TEXTOS.jardim.nenhumaPlantaNoJardim : TEXTOS.jardim.quantidadeDePlantas(quantidade);
  }

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

  function fecharSeletor() {
    definirSeletorAberto(false);
    definirJardimEmEdicao(null);
  }

  function editarJardim(jardim: Jardim) {
    definirJardimEmEdicao(jardim);
    definirNomeEditado(jardim.nome);
    definirErroDaEdicao(false);
  }

  async function salvarNomeDoJardim() {
    if (jardimEmEdicao === null) return;
    try {
      await container.gerenciarJardins.renomear(jardimEmEdicao.id, nomeEditado);
      await recarregarJardins();
      definirJardimEmEdicao(null);
    } catch {
      definirErroDaEdicao(true);
    }
  }

  function pedirExclusaoDoJardim() {
    if (jardimEmEdicao === null) return;
    definirJardimParaExcluir(jardimEmEdicao);
    definirExclusaoDoJardim('confirmando');
    fecharSeletor();
  }

  async function excluirJardim() {
    if (jardimParaExcluir === null) return;
    definirExclusaoDoJardim('excluindo');
    try {
      await container.excluirJardim.executar(jardimParaExcluir.id);
      await recarregarJardins();
      await recarregarJardim();
      definirJardimParaExcluir(null);
    } catch (falha) {
      console.warn('Não deu para excluir o jardim.', falha);
      definirExclusaoDoJardim('erro');
    }
  }

  function quantidadeDePlantas(idJardim: string) {
    return idJardim === idJardimSelecionado ? lista.length : plantasPorJardim.get(idJardim) ?? 0;
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
        <Cartao compacto estilo={estilos.margemDoCartao}>
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
        </Cartao>

        <View style={estilos.cabecalhoJardim}>
          <CabecalhoDoJardim quantidade={lista.length} />
        </View>

        {container.pareamentoDoSensor || container.controleDoSensorDeDesenvolvimento ? (
          <Cartao compacto estilo={estilos.margemDoCartao}>
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
                      finalDoEndereco(sensor.id),
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
          </Cartao>
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
      <Modal visible={seletorAberto} transparent animationType="fade" onRequestClose={fecharSeletor}>
        <Pressable style={estilos.fundoDoModal} onPress={fecharSeletor} accessible={false}>
          <Pressable style={estilos.modal} accessibilityViewIsModal onPress={() => undefined}>
            {jardimEmEdicao !== null ? (
              <>
                <Text style={TEXTO.subtitulo} accessibilityRole="header">{TEXTOS.jardim.editarJardim}</Text>
                <Text style={TEXTO.rotulo}>{TEXTOS.jardim.rotuloDoNomeDoJardim}</Text>
                <TextInput accessibilityLabel={TEXTOS.jardim.nomeDoJardim} value={nomeEditado} onChangeText={definirNomeEditado}
                  placeholderTextColor={CORES.textoApoio} style={estilos.entrada} />
                {erroDaEdicao ? (
                  <Text style={estilos.erroDoSensor} accessibilityRole="alert">{TEXTOS.jardim.falhaAoRenomear}</Text>
                ) : null}
                <View style={estilos.acoesDoModal}>
                  <BotaoPrincipal titulo={TEXTOS.comum.cancelar} variante="secundaria" aoTocar={() => definirJardimEmEdicao(null)} />
                  <BotaoPrincipal titulo={TEXTOS.jardim.salvarNome} aoTocar={() => void salvarNomeDoJardim()}
                    desabilitado={!nomeEditado.trim()} />
                </View>
                {/* Excluir fica à parte e em vermelho, longe do Salvar: é o único que não volta atrás. */}
                {jardimEmEdicao.id !== JARDIM_PRINCIPAL.id ? (
                  <BotaoPrincipal titulo={TEXTOS.jardim.excluirJardim} variante="perigoDiscreto" largo
                    aoTocar={pedirExclusaoDoJardim} />
                ) : null}
              </>
            ) : (
              <>
            <Text style={TEXTO.subtitulo} accessibilityRole="header">{TEXTOS.jardim.seusJardins}</Text>
            <Text style={TEXTO.apoio}>{TEXTOS.jardim.escolhaOJardim}</Text>
            <ScrollView style={estilos.listaDeJardins} showsVerticalScrollIndicator={false}>
              {jardins.map((jardim) => {
                const selecionado = jardim.id === idJardimSelecionado;
                return (
                  <View key={jardim.id} style={[estilos.opcaoDeJardim, selecionado && estilos.jardimSelecionado]}>
                    <Pressable accessibilityRole="button" accessibilityState={{ selected: selecionado }}
                      onPress={() => void trocarJardim(jardim.id)} style={estilos.escolhaDoJardim}>
                      <View style={estilos.detalheDaOpcao}>
                        <Text style={estilos.nomeDaOpcao}>{jardim.nome}</Text>
                        <Text style={TEXTO.apoio}>{textoDaQuantidade(jardim.id)}</Text>
                      </View>
                      {selecionado ? <Text style={estilos.seloAtual}>{TEXTOS.jardim.seloAtual}</Text> : null}
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={TEXTOS.jardim.editarOJardim(jardim.nome)}
                      onPress={() => editarJardim(jardim)} hitSlop={ESPACO.pequeno} style={estilos.botaoDeEditar}>
                      <Text style={estilos.textoDeEditar}>{TEXTOS.jardim.editar}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
            <Text style={TEXTO.rotulo}>{TEXTOS.jardim.rotuloDoNovoJardim}</Text>
            <TextInput accessibilityLabel={TEXTOS.jardim.nomeDoNovoJardim} value={novoNome} onChangeText={definirNovoNome}
              placeholder={TEXTOS.jardim.exemploDeNome} placeholderTextColor={CORES.textoApoio} style={estilos.entrada} />
            {erroDoJardim ? <Text style={estilos.erroDoSensor} accessibilityRole="alert">{TEXTOS.jardim.falhaAoTrocarJardim}</Text> : null}
            <View style={estilos.acoesDoModal}>
              <BotaoPrincipal titulo={TEXTOS.comum.cancelar} variante="secundaria" aoTocar={fecharSeletor} />
              <BotaoPrincipal titulo={TEXTOS.jardim.criarJardim} aoTocar={() => void criar()} desabilitado={!novoNome.trim()} />
            </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
      <DialogoDeConfirmacao
        titulo={TEXTOS.jardim.excluirOJardim(jardimParaExcluir?.nome ?? '')}
        explicacao={TEXTOS.jardim.explicacaoDaExclusao(jardimParaExcluir ? quantidadeDePlantas(jardimParaExcluir.id) : 0)}
        tituloDoBotao={TEXTOS.jardim.excluir}
        tituloEmAndamento={TEXTOS.jardim.excluindo}
        mensagemDeErro={TEXTOS.jardim.falhaAoExcluir}
        visivel={jardimParaExcluir !== null}
        emAndamento={exclusaoDoJardim === 'excluindo'}
        erro={exclusaoDoJardim === 'erro'}
        aoConfirmar={() => void excluirJardim()}
        aoCancelar={() => definirJardimParaExcluir(null)}
      />
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
  /**
   * Os dois cartões de abrir e fechar ficam afastados da borda da tela, como o resto da estante. Sem a largura de
   * 100% do Cartao: somada à margem, ela passava da tela e a margem sumia.
   */
  margemDoCartao: { width: 'auto', alignSelf: 'stretch', marginHorizontal: ESPACO.grande },
  cabecalhoJardim: { width: '100%', maxWidth: LARGURA_DO_CONTEUDO, alignSelf: 'center' },
  detalheDoCartaoCompacto: { flex: 1, gap: ESPACO.fino },
  nomeDoJardim: { fontFamily: FONTES.titulo, fontSize: 20, lineHeight: 24, color: CORES.texto },
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
  fundoDoModal: { flex: 1, justifyContent: 'center', padding: ESPACO.grande, backgroundColor: CORES.veuDoModal },
  modal: { width: '100%', maxWidth: LARGURA_DO_MODAL, maxHeight: '85%', alignSelf: 'center', padding: ESPACO.folgado,
    gap: ESPACO.medio, borderRadius: RAIO.grande, backgroundColor: CORES.superficie },
  listaDeJardins: { flexGrow: 0, maxHeight: 250 },
  opcaoDeJardim: { minHeight: ALVO_DE_TOQUE + 8, flexDirection: 'row', alignItems: 'center', marginBottom: ESPACO.pequeno,
    borderWidth: 1, borderColor: CORES.bordaSuave, borderRadius: RAIO.medio, backgroundColor: CORES.fundoTopo },
  escolhaDoJardim: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: ESPACO.medio },
  botaoDeEditar: { minHeight: ALVO_DE_TOQUE, justifyContent: 'center', paddingHorizontal: ESPACO.medio },
  textoDeEditar: { ...TEXTO.apoio, fontFamily: FONTES.forte, color: CORES.acao, textDecorationLine: 'underline' },
  jardimSelecionado: { borderColor: CORES.acao, backgroundColor: CORES.papel },
  detalheDaOpcao: { flex: 1, gap: ESPACO.minimo },
  nomeDaOpcao: { ...TEXTO.corpo, color: CORES.texto, fontFamily: FONTES.forte },
  seloAtual: { ...TEXTO.rotulo, color: CORES.acao },
  entrada: { minHeight: ALVO_DE_TOQUE, paddingHorizontal: ESPACO.medio, borderWidth: 1,
    borderColor: CORES.bordaSuave, borderRadius: RAIO.medio, color: CORES.texto, backgroundColor: CORES.fundoTopo },
  acoesDoModal: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: ESPACO.pequeno },
});

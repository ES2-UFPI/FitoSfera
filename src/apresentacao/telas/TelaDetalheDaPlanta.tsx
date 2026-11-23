import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlantaNoJardim } from '@/aplicacao/casos-de-uso/PlantaNoJardim';
import { RegistroDeColheita } from '@/dominio/modelos/RegistroDeColheita';
import { LuzDoDia } from '@/dominio/regras/LuzDoDia';
import { estagioDaPlanta } from '@/dominio/regras/EstagioDaPlanta';
import { ehNoite, faixasDoPeriodo } from '@/dominio/regras/PeriodoDoDia';
import { JANELA_DA_ESTIMATIVA_MS } from '@/dominio/regras/EstimadorDeColheitaPorCondicoes';
import { TEXTOS } from '@/textos';
import { CartaoDasColheitas, EstadoDasColheitas } from '../colheita/CartaoDasColheitas';
import { BlocoDeColheita } from '../colheita/BlocoDeColheita';
import { FormularioDeColheita } from '../colheita/FormularioDeColheita';
import { BotaoVoltar } from '../componentes/BotaoVoltar';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { CartaoDaDificuldade } from '../componentes/CartaoDaDificuldade';
import { CartaoDaLuzDeHoje, INTERVALO_DA_LUZ_DE_HOJE_MS } from '../componentes/CartaoDaLuzDeHoje';
import { CartaoDoHistorico, EstadoDoHistorico } from '../componentes/CartaoDoHistorico';
import { ConfirmacaoDeExclusao } from '../componentes/ConfirmacaoDeExclusao';
import { DialogoDeConfirmacao } from '../componentes/DialogoDeConfirmacao';
import { descreverQuantidade } from '../colheita/FormularioDeColheita';
import { dataLegivel, formatarData } from '../formatarData';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { SeloDeStatus } from '../componentes/SeloDeStatus';
import { IndicadorDeConexao } from '../componentes/IndicadorDeConexao';
import { IconeRegador } from '../componentes/IconeRegador';
import { RegaEmOutroDia } from '../componentes/RegaEmOutroDia';
import { escreverDia, lerDia } from '../colheita/entradaDaColheita';
import {
  EstadoDoPainel,
  FaixasRecomendadasDoPainel,
  PainelDeCondicoes,
} from '../componentes/PainelDeCondicoes';
import { useConexaoDoSensor } from '../componentes/useConexaoDoSensor';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { TabuaDeMadeira } from '../estante/Prateleira';
import { DesenhoDaPlanta } from '../ilustracao/DesenhoDaPlanta';
import { CORES, ESPACO, FONTES, LARGURA_DO_CONTEUDO, RAIO, TEXTO } from '../tema';

/**
 * As faixas que o painel mostra, pelas do período da leitura (a mesma regra dos avisos e do selo da estante).
 * Sem leitura, vale a hora de agora: à noite, a faixa de luz do dia não faz sentido.
 */
function faixasDoPainel(item: PlantaNoJardim, momento: Date): FaixasRecomendadasDoPainel | undefined {
  const faixas = item.planta.faixasRecomendadas;
  if (faixas === null) return undefined;
  const doPeriodo = faixasDoPeriodo(faixas, momento);
  return {
    umidadePercentual: doPeriodo.umidadeDoAr,
    temperaturaCelsius: doPeriodo.temperatura,
    luminosidadeLux: doPeriodo.luminosidade ?? undefined,
  };
}

function estadoDoPainel(item: PlantaNoJardim, agora: Date, atualizando = false, offline = false): EstadoDoPainel {
  if (item.ultimaLeitura !== null) {
    return {
      tipo: 'leitura',
      leitura: item.ultimaLeitura,
      desatualizada: item.leituraDesatualizada,
      offline,
      faixasRecomendadas: faixasDoPainel(item, item.ultimaLeitura.medidaEm),
      noite: ehNoite(item.ultimaLeitura.medidaEm),
      atualizando,
    };
  }
  return { tipo: 'sem-leitura', faixasRecomendadas: faixasDoPainel(item, agora), noite: ehNoite(agora) };
}

/** Quanto tempo a confirmação de edição fica no topo do detalhe. */
const TEMPO_DA_FAIXA_DE_EDICAO_MS = 4_000;
/** Tempo para desfazer uma rega tocada sem querer. */
const PRAZO_PARA_DESFAZER_A_REGA_MS = 8_000;

export function TelaDetalheDaPlanta({ id }: { id: string }) {
  const { container, recarregarJardim, idJardimSelecionado, consumirEdicaoSalva, jardins, abrirJardimDaPlanta } =
    useAplicativo();
  const navegador = useRouter();
  const margens = useSafeAreaInsets();
  const conexao = useConexaoDoSensor();
  const [item, definirItem] = useState<PlantaNoJardim | null | undefined | 'falhou'>(undefined);
  const [estadoDaRega, definirEstadoDaRega] = useState<
    'ocioso' | 'registrando' | 'sucesso' | 'desfazendo' | 'desfeita' | 'erro' | 'erroAoDesfazer'
  >('ocioso');
  // A rega que o "Desfazer" apaga; null quando o prazo para desfazer acabou.
  const [regaDesfazivel, definirRegaDesfazivel] = useState<string | null>(null);
  // O dia da última rega registrada, quando foi em outro dia; null quando foi agora.
  const [diaDaRegaRegistrada, definirDiaDaRegaRegistrada] = useState<string | null>(null);
  const [atualizandoLeitura, definirAtualizandoLeitura] = useState(false);
  const [historico, definirHistorico] = useState<EstadoDoHistorico>(undefined);
  const [colheitas, definirColheitas] = useState<EstadoDasColheitas>(undefined);
  const [leiturasRecentes, definirLeiturasRecentes] = useState<readonly import('@/dominio/modelos/Leitura').Leitura[]>([]);
  const [luzDeHoje, definirLuzDeHoje] = useState<LuzDoDia | undefined>(undefined);
  const [tiqueDaLuz, definirTiqueDaLuz] = useState(0);
  const [exclusao, definirExclusao] = useState<'fechada' | 'confirmando' | 'excluindo' | 'erro'>('fechada');
  const registroEmAndamento = useRef(false);
  const rolagem = useRef<ScrollView>(null);
  const [colheitaParaApagar, definirColheitaParaApagar] = useState<RegistroDeColheita | null>(null);
  const [apagandoColheita, definirApagandoColheita] = useState(false);
  const [erroAoApagarColheita, definirErroAoApagarColheita] = useState(false);
  const [edicaoSalva, definirEdicaoSalva] = useState(false);
  // Muda a cada edição salva: remonta o formulário de colheita, que assim esquece a confirmação antiga.
  const [geracaoDaEdicao, definirGeracaoDaEdicao] = useState(0);
  const inclinacaoDoRegador = useRef(new Animated.Value(0)).current;

  function animarRegador(): Promise<void> {
    inclinacaoDoRegador.stopAnimation();
    inclinacaoDoRegador.setValue(0);
    return new Promise((concluir) => {
      Animated.sequence([
        Animated.timing(inclinacaoDoRegador, { toValue: 1, duration: 180, useNativeDriver: false }),
        Animated.timing(inclinacaoDoRegador, { toValue: 0, duration: 260, useNativeDriver: false }),
      ]).start(() => concluir());
    });
  }

  async function registrarRega() {
    if (registroEmAndamento.current || !item || item === 'falhou') return;
    registroEmAndamento.current = true;
    const animacao = animarRegador();
    definirEstadoDaRega('registrando');
    try {
      const [rega] = await Promise.all([container.registrarRega.executar(item.planta.id), animacao]);
      definirDiaDaRegaRegistrada(null);
      definirEstadoDaRega('sucesso');
      definirRegaDesfazivel(rega.id);
      void carregarHistorico(item.planta);
    } catch {
      await animacao;
      definirEstadoDaRega('erro');
    } finally {
      registroEmAndamento.current = false;
    }
  }

  /** A rega esquecida: a data inválida volta como erro para o próprio campo mostrar. */
  async function registrarRegaEmOutroDia(texto: string) {
    if (!item || item === 'falhou') return;
    const rega = await container.registrarRega.executar(item.planta.id, lerDia(texto));
    const deHoje = rega.regadaEm.getTime() === container.relogio.agora().getTime();
    definirDiaDaRegaRegistrada(deHoje ? null : formatarData(rega.regadaEm));
    definirEstadoDaRega('sucesso');
    definirRegaDesfazivel(rega.id);
    void carregarHistorico(item.planta);
  }

  async function desfazerRega() {
    if (regaDesfazivel === null || !item || item === 'falhou') return;
    definirEstadoDaRega('desfazendo');
    try {
      await container.apagarRegistros.apagarRega(item.planta.id, regaDesfazivel);
      definirRegaDesfazivel(null);
      definirEstadoDaRega('desfeita');
      void carregarHistorico(item.planta);
    } catch (falha) {
      console.warn('Não deu para desfazer a rega.', falha);
      definirEstadoDaRega('erroAoDesfazer');
    }
  }

  // O "Desfazer" é para o toque duplo de agora, não para corrigir o histórico: some depois de alguns segundos.
  // Passado o prazo, a confirmação sai junto: o histórico logo abaixo já mostra a rega.
  useEffect(() => {
    if (regaDesfazivel === null) return;
    const temporizador = setTimeout(() => {
      definirRegaDesfazivel(null);
      definirEstadoDaRega((estado) => (estado === 'sucesso' ? 'ocioso' : estado));
    }, PRAZO_PARA_DESFAZER_A_REGA_MS);
    return () => clearTimeout(temporizador);
  }, [regaDesfazivel]);
  useEffect(() => {
    if (estadoDaRega !== 'desfeita') return;
    const temporizador = setTimeout(() => definirEstadoDaRega('ocioso'), TEMPO_DA_FAIXA_DE_EDICAO_MS);
    return () => clearTimeout(temporizador);
  }, [estadoDaRega]);

  function carregarHistorico(planta: PlantaNoJardim['planta']): Promise<void> {
    return container.obterHistorico.executar(planta).then(definirHistorico, (falha) => {
      console.warn('Não deu para ler o histórico de regas.', falha);
      definirHistorico('falhou');
    });
  }

  const plantaCarregada = item && item !== 'falhou' ? item.planta : null;
  useEffect(() => {
    if (plantaCarregada === null) return;
    let atual = true;
    container.obterHistorico.executar(plantaCarregada).then(
      (lido) => {
        if (atual) definirHistorico(lido);
      },
      (falha) => {
        console.warn('Não deu para ler o histórico de regas.', falha);
        if (atual) definirHistorico('falhou');
      },
    );
    return () => {
      atual = false;
    };
  }, [container, plantaCarregada?.id]);

  /** Colher marca a planta como produzindo: relê a planta junto com as colheitas para o bloco mostrar isso. */
  function aposColher(idPlanta: string): Promise<void> {
    const plantaRelida = container.obterPlanta.executar(id, idJardimSelecionado).then(
      (encontrado) => {
        if (encontrado !== null) definirItem(encontrado);
      },
      (falha) => console.warn('Não deu para reler a planta depois da colheita.', falha),
    );
    return Promise.all([carregarColheitas(idPlanta), plantaRelida]).then(() => undefined);
  }

  async function apagarColheita() {
    if (colheitaParaApagar === null || apagandoColheita) return;
    definirApagandoColheita(true);
    try {
      await container.apagarRegistros.apagarColheita(colheitaParaApagar.idPlanta, colheitaParaApagar.id);
      await carregarColheitas(colheitaParaApagar.idPlanta);
      definirColheitaParaApagar(null);
    } catch (falha) {
      console.warn('Não deu para apagar a colheita.', falha);
      definirErroAoApagarColheita(true);
    } finally {
      definirApagandoColheita(false);
    }
  }

  function carregarColheitas(idPlanta: string): Promise<void> {
    return container.obterColheitas.executar(idPlanta).then(definirColheitas, (falha) => {
      console.warn('Não deu para ler as colheitas.', falha);
      definirColheitas('falhou');
    });
  }

  // Só as frutíferas têm colheitas: as outras plantas nem leem o armazenamento delas.
  const frutiferaCarregada = item && item !== 'falhou' && item.especie?.frutifera ? item.planta.id : null;
  const jardimDaFrutifera = frutiferaCarregada !== null && item && item !== 'falhou' ? item.planta.idJardim : null;
  const instanteDaUltimaLeitura = jardimDaFrutifera !== null && item && item !== 'falhou'
    ? item.ultimaLeitura?.medidaEm.getTime() ?? null
    : null;
  useEffect(() => {
    if (jardimDaFrutifera === null) {
      definirLeiturasRecentes([]);
      return;
    }
    let atual = true;
    const agora = container.relogio.agora();
    container.obterLeiturasRecentes.executar(
      jardimDaFrutifera,
      new Date(agora.getTime() - JANELA_DA_ESTIMATIVA_MS),
    ).then(
      (lidas) => { if (atual) definirLeiturasRecentes(lidas); },
      (falha) => {
        console.warn('Não deu para ler o histórico ambiental.', falha);
        if (atual) definirLeiturasRecentes([]);
      },
    );
    return () => { atual = false; };
  }, [container, jardimDaFrutifera, instanteDaUltimaLeitura]);
  useEffect(() => {
    if (frutiferaCarregada === null) return;
    let atual = true;
    container.obterColheitas.executar(frutiferaCarregada).then(
      (lidas) => {
        if (atual) definirColheitas(lidas);
      },
      (falha) => {
        console.warn('Não deu para ler as colheitas.', falha);
        if (atual) definirColheitas('falhou');
      },
    );
    return () => {
      atual = false;
    };
  }, [container, frutiferaCarregada]);

  // Sem leitura nova, o tempo passando também muda a luz de hoje: o sensor calado deixa o dia incompleto.
  useEffect(() => {
    const relogio = setInterval(() => definirTiqueDaLuz((tique) => tique + 1), INTERVALO_DA_LUZ_DE_HOJE_MS);
    return () => clearInterval(relogio);
  }, []);

  // Cada versão nova do item (ao abrir, ao voltar para a tela, a cada leitura) pode trazer luz nova do sensor.
  const itemCarregado = item && item !== 'falhou' ? item : null;
  useEffect(() => {
    if (itemCarregado === null) return;
    let atual = true;
    container.obterLuzDoDia.executar(itemCarregado.planta).then(
      (lida) => {
        if (atual) definirLuzDeHoje(lida);
      },
      (falha) => console.warn('Não deu para ler a luz de hoje.', falha),
    );
    return () => {
      atual = false;
    };
  }, [container, itemCarregado, tiqueDaLuz]);

  async function excluirPlanta() {
    if (exclusao === 'excluindo') return;
    definirExclusao('excluindo');
    try {
      await container.excluirPlanta.executar(id);
      await recarregarJardim();
      navegador.dismissTo('/');
    } catch (falha) {
      console.warn('Não deu para excluir a planta.', falha);
      definirExclusao('erro');
    }
  }

  // Voltando da edição: a faixa de confirmação fica no topo, então a tela sobe até ela.
  useFocusEffect(
    useCallback(() => {
      if (!consumirEdicaoSalva(id)) return;
      definirEdicaoSalva(true);
      definirGeracaoDaEdicao((geracao) => geracao + 1);
      definirEstadoDaRega((estado) => (estado === 'registrando' || estado === 'desfazendo' ? estado : 'ocioso'));
      definirRegaDesfazivel(null);
      rolagem.current?.scrollTo({ y: 0, animated: false });
    }, [consumirEdicaoSalva, id]),
  );
  useEffect(() => {
    if (!edicaoSalva) return;
    const temporizador = setTimeout(() => definirEdicaoSalva(false), TEMPO_DA_FAIXA_DE_EDICAO_MS);
    return () => clearTimeout(temporizador);
  }, [edicaoSalva, geracaoDaEdicao]);

  useFocusEffect(
    useCallback(() => {
      let atual = true;
      container.obterPlanta.executar(id, idJardimSelecionado).then(
        async (encontrado) => {
          if (!atual) return;
          // A planta é de outro jardim (link ou notificação): abre o jardim dela, e a nova seleção recarrega a tela.
          if (encontrado === null && (await abrirJardimDaPlanta(id).catch(() => false))) return;
          if (!atual) return;
          definirItem(encontrado);
          // Uma rega apagada no histórico completo muda a "última rega" deste cartão.
          if (encontrado !== null) void carregarHistorico(encontrado.planta);
        },
        (falha) => {
          console.warn('Não deu para ler a planta do armazenamento do aparelho.', falha);
          if (atual) definirItem('falhou');
        },
      );
      return () => {
        atual = false;
      };
    }, [container, id, idJardimSelecionado, abrirJardimDaPlanta]),
  );

  useEffect(() => {
    if (!item || item === 'falhou' || item.planta.id !== id || item.planta.idJardim !== idJardimSelecionado) return;
    let ativo = true;
    let sequencia = 0;
    const cancelar = container.obterLeituraAtual.observar((leitura) => {
      const sequenciaDestaLeitura = ++sequencia;
      void container.obterPlanta.executarComLeitura(id, leitura, idJardimSelecionado).then(
        (atualizada) => {
          if (ativo && sequenciaDestaLeitura === sequencia && atualizada !== null) definirItem(atualizada);
        },
        (falha) => console.warn('Não deu para atualizar as condições da planta.', falha),
      );
    }, idJardimSelecionado);
    return () => {
      ativo = false;
      cancelar();
    };
  }, [container, id, idJardimSelecionado, item && item !== 'falhou' ? item.planta.id : null]);

  async function atualizarLeitura() {
    if (atualizandoLeitura) return;
    definirAtualizandoLeitura(true);
    try {
      const leitura = await container.obterLeituraAtual.executar(idJardimSelecionado);
      if (leitura !== null) {
        const atualizada = await container.obterPlanta.executarComLeitura(id, leitura, idJardimSelecionado);
        if (atualizada !== null) definirItem(atualizada);
      } else {
        definirItem((anterior) =>
          anterior && anterior !== 'falhou' && anterior.ultimaLeitura !== null
            ? {
                ...anterior,
                status: 'sem-dados',
                situacoes: null,
                leituraDesatualizada: true,
              }
            : anterior,
        );
      }
    } catch (falha) {
      console.warn('Não deu para atualizar as condições da planta.', falha);
      definirItem((anterior) =>
        anterior && anterior !== 'falhou' && anterior.ultimaLeitura !== null
          ? {
              ...anterior,
              status: 'sem-dados',
              situacoes: null,
              leituraDesatualizada: true,
            }
          : anterior,
      );
    } finally {
      definirAtualizandoLeitura(false);
    }
  }

  return (
    <FundoAconchegante style={{ paddingTop: margens.top + ESPACO.pequeno }}>
      <View style={estilos.topo}>
        <BotaoVoltar />
      </View>
      {item === null ? (
        <View style={estilos.centro}>
          <Text style={TEXTO.subtitulo}>{TEXTOS.comum.plantaNaoEncontrada}</Text>
          <Text style={[TEXTO.corpo, estilos.texto]}>{TEXTOS.comum.plantaPodeTerSaido}</Text>
        </View>
      ) : null}
      {item === 'falhou' ? (
        <View style={estilos.centro}>
          <Text style={TEXTO.subtitulo}>{TEXTOS.comum.naoDeuParaAbrirAPlanta}</Text>
          <Text style={[TEXTO.corpo, estilos.texto]}>{TEXTOS.comum.tenteEmInstantes}</Text>
        </View>
      ) : null}
      {item && item !== 'falhou' ? (
        <ScrollView
          ref={rolagem}
          contentContainerStyle={[
            estilos.conteudo,
            { paddingBottom: margens.bottom + ESPACO.folgado },
          ]}
          scrollIndicatorInsets={{ bottom: margens.bottom }}
          refreshControl={
            <RefreshControl
              refreshing={atualizandoLeitura}
              onRefresh={() => void atualizarLeitura()}
            />
          }
        >
          <View style={estilos.planta}>
            <View style={estilos.desenho} accessible={false} importantForAccessibility="no-hide-descendants">
              <DesenhoDaPlanta aparencia={item.planta.aparencia} largura={72} respirando />
              <TabuaDeMadeira estilo={estilos.tabua} />
            </View>
            <View style={estilos.identificacao}>
              <Text style={TEXTO.titulo} accessibilityRole="header">
                {item.planta.apelido}
              </Text>
              <Text style={estilos.especie}>{item.especie?.nomeComum ?? TEXTOS.comum.especieDesconhecida}</Text>
              <View style={estilos.status}>
                <SeloDeStatus status={item.status} />
              </View>
              {edicaoSalva ? (
                <Text style={estilos.faixaDeEdicao} accessibilityLiveRegion="polite" accessibilityRole="alert">
                  {TEXTOS.detalhe.alteracoesSalvas}
                </Text>
              ) : null}
            </View>
          </View>
          <PainelDeCondicoes
            estado={estadoDoPainel(
              item,
              container.relogio.agora(),
              atualizandoLeitura,
              conexao !== null && conexao.estado !== 'conectado' && conexao.estado !== 'conectando',
            )}
            origem={(
              <IndicadorDeConexao
                conexao={conexao}
                agora={container.controleDoSensorDeDesenvolvimento?.obterHorarioSimulado(idJardimSelecionado)}
              />
            )}
          />
          <CartaoDaLuzDeHoje
            luz={luzDeHoje}
            jardimSemSensor={jardins.find((jardim) => jardim.id === item.planta.idJardim)?.idSensor == null}
          />
          <CartaoDaDificuldade especie={item.especie} />
          {item.especie?.frutifera ? (
            <BlocoDeColheita
              estimativa={container.estimadorDeColheita.estimar(
                item.planta,
                item.especie,
                leiturasRecentes,
                container.relogio.agora(),
              )}
              estagio={estagioDaPlanta(item.planta, item.especie, container.relogio.agora())}
              colheitaIniciada={item.planta.colheitaIniciada}
              ultimaColheitaEm={
                colheitas !== undefined && colheitas !== 'falhou' ? colheitas.registros[0]?.colhidaEm ?? null : null
              }
              aoInformarFloracao={() => navegador.push({ pathname: '/editar/[id]/apelido', params: { id } })}
              aoInformarPlantio={() => navegador.push({ pathname: '/editar/[id]/apelido', params: { id } })}
            />
          ) : null}
          <CartaoDoHistorico
            estado={historico}
            rodape={
              <BotaoPrincipal
                titulo={TEXTOS.detalhe.verTodasAsRegas}
                variante="secundaria"
                aoTocar={() => navegador.push({ pathname: '/historico/[id]', params: { id } })}
                largo
              />
            }
          >
            <BotaoPrincipal
              titulo={estadoDaRega === 'registrando' ? TEXTOS.detalhe.registrandoRega : TEXTOS.detalhe.registrarRega}
              aoTocar={() => void registrarRega()}
              desabilitado={estadoDaRega === 'registrando'}
              icone={
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: inclinacaoDoRegador.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '28deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <IconeRegador cor={CORES.textoDaAcao} tamanho={22} testID="icone-rega" />
                </Animated.View>
              }
              variante="rega"
              largo
            />
            <RegaEmOutroDia
              diaInicial={escreverDia(container.registrarRega.hoje())}
              aoRegistrar={registrarRegaEmOutroDia}
            />
            {/* Na falha ao desfazer, a linha continua: a mensagem pede para tentar de novo, então o botão precisa estar lá. */}
            {estadoDaRega === 'sucesso' || estadoDaRega === 'desfazendo' || estadoDaRega === 'erroAoDesfazer' ? (
              <View style={estilos.linhaDaConfirmacao}>
                <Text style={[TEXTO.corpo, estilos.confirmacao]} accessibilityLiveRegion="polite">
                  {diaDaRegaRegistrada === null
                    ? TEXTOS.detalhe.regaRegistrada
                    : TEXTOS.detalhe.regaRegistradaNoDia(diaDaRegaRegistrada)}
                </Text>
                {regaDesfazivel !== null ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      diaDaRegaRegistrada === null
                        ? TEXTOS.detalhe.desfazerRega
                        : TEXTOS.detalhe.desfazerRegaDoDia(diaDaRegaRegistrada)
                    }
                    accessibilityState={{ disabled: estadoDaRega === 'desfazendo' }}
                    disabled={estadoDaRega === 'desfazendo'}
                    onPress={() => void desfazerRega()}
                    hitSlop={ESPACO.pequeno}
                    style={estilos.desfazer}
                  >
                    <Text style={estilos.textoDoDesfazer}>
                      {estadoDaRega === 'desfazendo' ? TEXTOS.detalhe.desfazendoRega : TEXTOS.detalhe.desfazer}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            {estadoDaRega === 'desfeita' ? (
              <Text style={[TEXTO.corpo, estilos.confirmacao]} accessibilityLiveRegion="polite">
                {TEXTOS.detalhe.regaDesfeita}
              </Text>
            ) : null}
            {estadoDaRega === 'erroAoDesfazer' ? (
              <Text style={[TEXTO.corpo, estilos.erro]} accessibilityRole="alert">
                {TEXTOS.detalhe.falhaAoDesfazerRega}
              </Text>
            ) : null}
            {estadoDaRega === 'erro' ? (
              <Text style={[TEXTO.corpo, estilos.erro]} accessibilityRole="alert">
                {TEXTOS.detalhe.falhaAoRegistrarRega}
              </Text>
            ) : null}
          </CartaoDoHistorico>
          {item.especie?.frutifera ? (
            <>
              <CartaoDasColheitas
                estado={colheitas}
                aoApagar={(registro) => {
                  definirErroAoApagarColheita(false);
                  definirColheitaParaApagar(registro);
                }}
              />
              <FormularioDeColheita key={geracaoDaEdicao} idPlanta={item.planta.id} aoRegistrar={() => void aposColher(item.planta.id)} />
              <View style={estilos.atalhoDoRendimento}>
                <BotaoPrincipal
                  titulo={TEXTOS.rendimento.compararComOutras}
                  variante="secundaria"
                  aoTocar={() => navegador.push({ pathname: '/rendimento', params: { planta: item.planta.id } })}
                  largo
                />
              </View>
            </>
          ) : null}
          <View style={estilos.acoes}>
            <View style={estilos.acao}>
              <BotaoPrincipal
                titulo={TEXTOS.detalhe.editar}
                variante="secundaria"
                aoTocar={() => navegador.push({ pathname: '/editar/[id]', params: { id } })}
                largo
              />
            </View>
            <View style={estilos.acao}>
              <BotaoPrincipal
                titulo={TEXTOS.detalhe.excluir}
                variante="perigoDiscreto"
                aoTocar={() => definirExclusao('confirmando')}
                largo
              />
            </View>
          </View>
          <DialogoDeConfirmacao
            titulo={
              colheitaParaApagar
                ? TEXTOS.apagarRegistro.tituloDaColheita(
                    dataLegivel(colheitaParaApagar.colhidaEm),
                    descreverQuantidade(colheitaParaApagar),
                  )
                : ''
            }
            explicacao={TEXTOS.apagarRegistro.explicacaoDaColheita}
            tituloDoBotao={TEXTOS.apagarRegistro.confirmarColheita}
            tituloEmAndamento={TEXTOS.apagarRegistro.apagando}
            mensagemDeErro={TEXTOS.apagarRegistro.falha}
            visivel={colheitaParaApagar !== null}
            emAndamento={apagandoColheita}
            erro={erroAoApagarColheita}
            aoConfirmar={() => void apagarColheita()}
            aoCancelar={() => definirColheitaParaApagar(null)}
          />
          <ConfirmacaoDeExclusao
            apelido={item.planta.apelido}
            // Só fala das colheitas quando há alguma para perder.
            comColheitas={colheitas !== undefined && colheitas !== 'falhou' && colheitas.registros.length > 0}
            visivel={exclusao !== 'fechada'}
            excluindo={exclusao === 'excluindo'}
            erro={exclusao === 'erro'}
            aoConfirmar={() => void excluirPlanta()}
            aoCancelar={() => definirExclusao('fechada')}
          />
        </ScrollView>
      ) : null}
    </FundoAconchegante>
  );
}

const estilos = StyleSheet.create({
  topo: { paddingHorizontal: ESPACO.grande },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: ESPACO.folgado * 3, gap: ESPACO.minimo },
  conteudo: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: ESPACO.grande,
    paddingTop: ESPACO.pequeno,
    gap: ESPACO.grande,
  },
  planta: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: ESPACO.grande },
  desenho: { width: 88, alignItems: 'center' },
  tabua: { alignSelf: 'stretch' },
  identificacao: { flex: 1, gap: ESPACO.minimo },
  especie: { fontFamily: FONTES.forte, fontSize: 15, color: CORES.textoApoio },
  status: { marginTop: ESPACO.minimo },
  acoes: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: ESPACO.pequeno },
  atalhoDoRendimento: { alignSelf: 'stretch', maxWidth: LARGURA_DO_CONTEUDO, width: '100%' },
  acao: { flexGrow: 1, flexBasis: 140 },
  confirmacao: { color: CORES.texto, textAlign: 'center' },
  linhaDaConfirmacao: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: ESPACO.pequeno,
  },
  desfazer: { minHeight: 44, justifyContent: 'center', paddingHorizontal: ESPACO.pequeno },
  textoDoDesfazer: {
    ...TEXTO.corpo,
    fontFamily: FONTES.forte,
    color: CORES.acaoRega,
    textDecorationLine: 'underline',
  },
  faixaDeEdicao: {
    ...TEXTO.apoio,
    color: CORES.texto,
    marginTop: ESPACO.pequeno,
    alignSelf: 'flex-start',
    paddingHorizontal: ESPACO.pequeno,
    paddingVertical: ESPACO.fino,
    borderRadius: RAIO.pilula,
    borderWidth: 1,
    borderColor: CORES.bordaTranquila,
    backgroundColor: CORES.fundoTranquilo,
    overflow: 'hidden',
  },
  erro: { color: CORES.erro, textAlign: 'center' },
  texto: { textAlign: 'center', marginTop: ESPACO.medio, paddingHorizontal: ESPACO.folgado },
});

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlantaNoJardim } from '@/aplicacao/casos-de-uso/PlantaNoJardim';
import { LuzDoDia } from '@/dominio/regras/LuzDoDia';
import { estagioDaPlanta } from '@/dominio/regras/EstagioDaPlanta';
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
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { SeloDeStatus } from '../componentes/SeloDeStatus';
import { IndicadorDeConexao } from '../componentes/IndicadorDeConexao';
import { IconeRegador } from '../componentes/IconeRegador';
import {
  EstadoDoPainel,
  FaixasRecomendadasDoPainel,
  PainelDeCondicoes,
} from '../componentes/PainelDeCondicoes';
import { useConexaoDoSensor } from '../componentes/useConexaoDoSensor';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { TabuaDeMadeira } from '../estante/Prateleira';
import { DesenhoDaPlanta } from '../ilustracao/DesenhoDaPlanta';
import { CORES, ESPACO, FONTES, LARGURA_DO_CONTEUDO, TEXTO } from '../tema';

function faixasDoPainel(item: PlantaNoJardim): FaixasRecomendadasDoPainel | undefined {
  const faixas = item.planta.faixasRecomendadas;
  if (faixas === null) return undefined;
  return {
    umidadePercentual: faixas.umidadeDoAr,
    temperaturaCelsius: faixas.temperatura,
    luminosidadeLux: faixas.luminosidade,
  };
}

function estadoDoPainel(item: PlantaNoJardim, atualizando = false, offline = false): EstadoDoPainel {
  const faixasRecomendadas = faixasDoPainel(item);
  if (item.ultimaLeitura !== null) {
    return {
      tipo: 'leitura',
      leitura: item.ultimaLeitura,
      desatualizada: item.leituraDesatualizada,
      offline,
      faixasRecomendadas,
      atualizando,
    };
  }
  return { tipo: 'sem-leitura', faixasRecomendadas };
}

export function TelaDetalheDaPlanta({ id }: { id: string }) {
  const { container, recarregarJardim, idJardimSelecionado } = useAplicativo();
  const navegador = useRouter();
  const margens = useSafeAreaInsets();
  const conexao = useConexaoDoSensor();
  const [item, definirItem] = useState<PlantaNoJardim | null | undefined | 'falhou'>(undefined);
  const [estadoDaRega, definirEstadoDaRega] = useState<'ocioso' | 'registrando' | 'sucesso' | 'erro'>('ocioso');
  const [atualizandoLeitura, definirAtualizandoLeitura] = useState(false);
  const [historico, definirHistorico] = useState<EstadoDoHistorico>(undefined);
  const [colheitas, definirColheitas] = useState<EstadoDasColheitas>(undefined);
  const [leiturasRecentes, definirLeiturasRecentes] = useState<readonly import('@/dominio/modelos/Leitura').Leitura[]>([]);
  const [luzDeHoje, definirLuzDeHoje] = useState<LuzDoDia | undefined>(undefined);
  const [tiqueDaLuz, definirTiqueDaLuz] = useState(0);
  const [exclusao, definirExclusao] = useState<'fechada' | 'confirmando' | 'excluindo' | 'erro'>('fechada');
  const registroEmAndamento = useRef(false);
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
      await Promise.all([container.registrarRega.executar(item.planta.id), animacao]);
      definirEstadoDaRega('sucesso');
      void carregarHistorico(item.planta);
    } catch {
      await animacao;
      definirEstadoDaRega('erro');
    } finally {
      registroEmAndamento.current = false;
    }
  }

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

  useFocusEffect(
    useCallback(() => {
      let atual = true;
      container.obterPlanta.executar(id, idJardimSelecionado).then(
        (encontrado) => {
          if (atual) definirItem(encontrado);
        },
        (falha) => {
          console.warn('Não deu para ler a planta do armazenamento do aparelho.', falha);
          if (atual) definirItem('falhou');
        },
      );
      return () => {
        atual = false;
      };
    }, [container, id, idJardimSelecionado]),
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
            </View>
          </View>
          <PainelDeCondicoes
            estado={estadoDoPainel(
              item,
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
          <CartaoDaLuzDeHoje luz={luzDeHoje} />
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
            {estadoDaRega === 'sucesso' ? (
              <Text style={[TEXTO.corpo, estilos.confirmacao]} accessibilityLiveRegion="polite">
                {TEXTOS.detalhe.regaRegistrada}
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
              <CartaoDasColheitas estado={colheitas} />
              <FormularioDeColheita idPlanta={item.planta.id} aoRegistrar={() => void carregarColheitas(item.planta.id)} />
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
          <ConfirmacaoDeExclusao
            apelido={item.planta.apelido}
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
  erro: { color: CORES.erro, textAlign: 'center' },
  texto: { textAlign: 'center', marginTop: ESPACO.medio, paddingHorizontal: ESPACO.folgado },
});

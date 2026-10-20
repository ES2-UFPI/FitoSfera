import { useEffect, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlantaNoJardim } from '@/aplicacao/casos-de-uso/PlantaNoJardim';
import { BotaoVoltar } from '../componentes/BotaoVoltar';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { IconeRegador } from '../componentes/IconeRegador';
import {
  EstadoDoPainel,
  FaixasRecomendadasDoPainel,
  PainelDeCondicoes,
} from '../componentes/PainelDeCondicoes';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { TabuaDeMadeira } from '../estante/Prateleira';
import { DesenhoDaPlanta } from '../ilustracao/DesenhoDaPlanta';
import { CORES } from '../tema/cores';
import { ESPACO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';

function faixasDoPainel(item: PlantaNoJardim): FaixasRecomendadasDoPainel | undefined {
  const faixas = item.planta.faixasRecomendadas;
  if (faixas === null) return undefined;
  return {
    umidadePercentual: faixas.umidadeDoAr,
    temperaturaCelsius: faixas.temperatura,
    luminosidadeLux: faixas.luminosidade,
  };
}

function estadoDoPainel(item: PlantaNoJardim, atualizando = false): EstadoDoPainel {
  const faixasRecomendadas = faixasDoPainel(item);
  if (item.ultimaLeitura !== null) {
    return {
      tipo: 'leitura',
      leitura: item.ultimaLeitura,
      desatualizada: item.leituraDesatualizada,
      faixasRecomendadas,
      atualizando,
    };
  }
  return { tipo: 'sem-leitura', faixasRecomendadas };
}

export function TelaDetalheProvisorio({ id }: { id: string }) {
  const { container } = useAplicativo();
  const margens = useSafeAreaInsets();
  // undefined: carregando; null: não existe; 'falhou': o armazenamento não respondeu.
  const [item, definirItem] = useState<PlantaNoJardim | null | undefined | 'falhou'>(undefined);
  const [estadoDaRega, definirEstadoDaRega] = useState<'ocioso' | 'registrando' | 'sucesso' | 'erro'>('ocioso');
  const [atualizandoLeitura, definirAtualizandoLeitura] = useState(false);
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
    } catch {
      await animacao;
      definirEstadoDaRega('erro');
    } finally {
      registroEmAndamento.current = false;
    }
  }

  useEffect(() => {
    let atual = true;
    container.obterPlanta.executar(id).then(
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
  }, [container, id]);

  useEffect(() => {
    if (!item || item === 'falhou' || item.planta.id !== id) return;
    let ativo = true;
    let sequencia = 0;
    const cancelar = container.obterLeituraAtual.observar((leitura) => {
      const sequenciaDestaLeitura = ++sequencia;
      void container.obterPlanta.executarComLeitura(id, leitura).then(
        (atualizada) => {
          if (ativo && sequenciaDestaLeitura === sequencia && atualizada !== null) definirItem(atualizada);
        },
        (falha) => console.warn('Não deu para atualizar as condições da planta.', falha),
      );
    });
    return () => {
      ativo = false;
      cancelar();
    };
  }, [container, id, item && item !== 'falhou' ? item.planta.id : null]);

  async function atualizarLeitura() {
    if (atualizandoLeitura) return;
    definirAtualizandoLeitura(true);
    try {
      const leitura = await container.obterLeituraAtual.executar();
      if (leitura !== null) {
        const atualizada = await container.obterPlanta.executarComLeitura(id, leitura);
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
          <Text style={TEXTO.subtitulo}>Planta não encontrada</Text>
          <Text style={[TEXTO.corpo, estilos.texto]}>Ela pode ter saído da sua estante.</Text>
        </View>
      ) : null}
      {item === 'falhou' ? (
        <View style={estilos.centro}>
          <Text style={TEXTO.subtitulo}>Não deu para abrir esta planta agora.</Text>
          <Text style={[TEXTO.corpo, estilos.texto]}>Volte e tente de novo em instantes.</Text>
        </View>
      ) : null}
      {item && item !== 'falhou' ? (
        <ScrollView
          contentContainerStyle={estilos.conteudo}
          refreshControl={
            <RefreshControl
              refreshing={atualizandoLeitura}
              onRefresh={() => void atualizarLeitura()}
            />
          }
        >
          <View style={estilos.planta}>
            <DesenhoDaPlanta aparencia={item.planta.aparencia} largura={150} respirando />
            <TabuaDeMadeira estilo={estilos.tabua} />
            <Text style={[TEXTO.titulo, estilos.apelido]} accessibilityRole="header">
              {item.planta.apelido}
            </Text>
            <Text style={estilos.especie}>{item.especie?.nomeComum ?? 'Espécie desconhecida'}</Text>
          </View>
          <PainelDeCondicoes estado={estadoDoPainel(item, atualizandoLeitura)} />
          <View style={estilos.rega}>
            <BotaoPrincipal
              titulo={estadoDaRega === 'registrando' ? 'Registrando rega…' : 'Registrar rega'}
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
                ✓ Rega registrada agora.
              </Text>
            ) : null}
            {estadoDaRega === 'erro' ? (
              <Text style={[TEXTO.corpo, estilos.erro]} accessibilityRole="alert">
                Não deu para registrar a rega. Tente novamente.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      ) : null}
    </FundoAconchegante>
  );
}

const estilos = StyleSheet.create({
  topo: { paddingHorizontal: ESPACO.grande },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: ESPACO.folgado * 3, gap: 4 },
  conteudo: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: ESPACO.grande,
    paddingTop: ESPACO.medio,
    paddingBottom: ESPACO.folgado,
    gap: ESPACO.folgado,
  },
  planta: { alignItems: 'center', gap: ESPACO.minimo },
  tabua: { alignSelf: 'stretch', marginHorizontal: ESPACO.folgado * 2, marginBottom: ESPACO.amplo },
  apelido: { textAlign: 'center', paddingHorizontal: ESPACO.amplo },
  especie: { fontFamily: FONTES.forte, fontSize: 15, color: CORES.textoApoio },
  rega: { alignSelf: 'stretch', gap: ESPACO.pequeno },
  confirmacao: { color: CORES.texto, textAlign: 'center' },
  erro: { color: CORES.erro, textAlign: 'center' },
  texto: { textAlign: 'center', marginTop: ESPACO.medio, paddingHorizontal: ESPACO.folgado },
});

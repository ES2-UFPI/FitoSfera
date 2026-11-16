import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIMITE_DO_HISTORICO_DE_REGAS, RegaDoHistorico } from '@/aplicacao/casos-de-uso/ListarRegasDaPlanta';
import { TEXTOS } from '@/textos';
import { BotaoDeApagar } from '../componentes/BotaoDeApagar';
import { BotaoVoltar } from '../componentes/BotaoVoltar';
import { DialogoDeConfirmacao } from '../componentes/DialogoDeConfirmacao';
import { descreverQuandoRegou } from '../componentes/CartaoDoHistorico';
import { formatarData } from '../formatarData';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { IconeRegador } from '../componentes/IconeRegador';
import { MensagemDeVazio } from '../componentes/MensagemDeVazio';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { CORES, ESPACO, FONTES, LARGURA_DO_CONTEUDO, RAIO, TEXTO } from '../tema';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'falhou' }
  | { tipo: 'sem-planta' }
  | { tipo: 'pronto'; apelido: string; regas: readonly RegaDoHistorico[] };

/** Quantas regas a lista está mostrando, avisando quando o limite cortou as mais antigas. */
export function resumirQuantidade(quantidade: number): string {
  if (quantidade >= LIMITE_DO_HISTORICO_DE_REGAS) return TEXTOS.historico.regasMaisRecentes(LIMITE_DO_HISTORICO_DE_REGAS);
  return TEXTOS.historico.regasRegistradas(quantidade);
}

/** As regas anteriores de uma planta, da mais recente para a mais antiga. Aberta pelo detalhe. */
export function TelaHistoricoDeRegas({ id }: { id: string }) {
  const { container, idJardimSelecionado } = useAplicativo();
  const margens = useSafeAreaInsets();
  const [estado, definirEstado] = useState<Estado>({ tipo: 'carregando' });
  const [paraApagar, definirParaApagar] = useState<RegaDoHistorico | null>(null);
  const [apagando, definirApagando] = useState(false);
  const [erroAoApagar, definirErroAoApagar] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let atual = true;
      Promise.all([
        container.obterPlanta.executar(id, idJardimSelecionado),
        container.listarRegas.executar(id),
      ]).then(
        ([item, regas]) => {
          if (!atual) return;
          definirEstado(
            item === null ? { tipo: 'sem-planta' } : { tipo: 'pronto', apelido: item.planta.apelido, regas },
          );
        },
        (falha) => {
          console.warn('Não deu para ler o histórico de regas.', falha);
          if (atual) definirEstado({ tipo: 'falhou' });
        },
      );
      return () => {
        atual = false;
      };
    }, [container, id, idJardimSelecionado]),
  );

  function pedirParaApagar(rega: RegaDoHistorico) {
    definirErroAoApagar(false);
    definirParaApagar(rega);
  }

  async function apagar() {
    if (paraApagar === null || apagando) return;
    definirApagando(true);
    try {
      await container.apagarRegistros.apagarRega(id, paraApagar.rega.id);
      const regas = await container.listarRegas.executar(id);
      definirEstado((anterior) => (anterior.tipo === 'pronto' ? { ...anterior, regas } : anterior));
      definirParaApagar(null);
    } catch (falha) {
      console.warn('Não deu para apagar a rega.', falha);
      definirErroAoApagar(true);
    } finally {
      definirApagando(false);
    }
  }

  const quandoParaApagar = paraApagar
    ? formatarData(paraApagar.rega.regadaEm, { comHora: true }) ?? TEXTOS.historico.dataDesconhecida
    : '';

  return (
    <FundoAconchegante style={{ paddingTop: margens.top + ESPACO.pequeno }}>
      <View style={estilos.topo}>
        <BotaoVoltar />
      </View>
      <ScrollView
        contentContainerStyle={[estilos.conteudo, { paddingBottom: margens.bottom + ESPACO.folgado }]}
        scrollIndicatorInsets={{ bottom: margens.bottom }}
      >
        <View style={estilos.cabecalho}>
          <Text style={TEXTO.titulo} accessibilityRole="header">
            {TEXTOS.historico.tituloDaTela}
          </Text>
          {estado.tipo === 'pronto' ? <Text style={estilos.apelido}>{estado.apelido}</Text> : null}
        </View>

        {estado.tipo === 'carregando' ? <Text style={TEXTO.corpo}>{TEXTOS.historico.buscandoRegas}</Text> : null}

        {estado.tipo === 'sem-planta' ? <Text style={TEXTO.subtitulo}>{TEXTOS.comum.plantaNaoEncontrada}</Text> : null}

        {estado.tipo === 'falhou' ? (
          <Text style={[TEXTO.corpo, estilos.erro]} accessibilityRole="alert">
            {TEXTOS.historico.falha}
          </Text>
        ) : null}

        {estado.tipo === 'pronto' && estado.regas.length === 0 ? <SemRegas /> : null}

        {estado.tipo === 'pronto' && estado.regas.length > 0 ? (
          <View style={estilos.lista}>
            <Text style={TEXTO.rotulo}>{resumirQuantidade(estado.regas.length).toUpperCase()}</Text>
            {estado.regas.map((item) => {
              const { rega, diasAtras } = item;
              const quando = formatarData(rega.regadaEm, { comHora: true }) ?? TEXTOS.historico.dataDesconhecida;
              return (
                <View key={rega.id} style={estilos.item}>
                  {/* A descrição é um elemento só para o leitor de tela; o botão fica fora dela para ser alcançável. */}
                  <View style={estilos.descricao} accessible accessibilityLabel={`${quando}, ${descreverQuandoRegou(diasAtras)}.`}>
                    <View style={estilos.marcador} />
                    <Text style={estilos.quando}>{quando}</Text>
                    <Text style={TEXTO.apoio}>{descreverQuandoRegou(diasAtras)}</Text>
                  </View>
                  <BotaoDeApagar rotulo={TEXTOS.apagarRegistro.rotuloDaRega(quando)} aoTocar={() => pedirParaApagar(item)} />
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
      <DialogoDeConfirmacao
        titulo={TEXTOS.apagarRegistro.tituloDaRega(quandoParaApagar)}
        explicacao={TEXTOS.apagarRegistro.explicacaoDaRega}
        tituloDoBotao={TEXTOS.apagarRegistro.confirmarRega}
        tituloEmAndamento={TEXTOS.apagarRegistro.apagando}
        mensagemDeErro={TEXTOS.apagarRegistro.falha}
        visivel={paraApagar !== null}
        emAndamento={apagando}
        erro={erroAoApagar}
        aoConfirmar={() => void apagar()}
        aoCancelar={() => definirParaApagar(null)}
      />
    </FundoAconchegante>
  );
}

/** A planta nunca foi regada: nada de lista vazia, e sim o convite para registrar a primeira rega. */
function SemRegas() {
  return (
    <MensagemDeVazio
      forma="tela"
      titulo={TEXTOS.historico.semRegasTitulo}
      texto={TEXTOS.historico.semRegasTexto}
      icone={<IconeRegador cor={CORES.acaoRega} tamanho={44} />}
    />
  );
}

const estilos = StyleSheet.create({
  topo: { paddingHorizontal: ESPACO.grande },
  conteudo: { flexGrow: 1, paddingHorizontal: ESPACO.grande, paddingTop: ESPACO.pequeno, gap: ESPACO.grande },
  cabecalho: { gap: ESPACO.minimo },
  apelido: { fontFamily: FONTES.forte, fontSize: 15, color: CORES.textoApoio },
  lista: {
    maxWidth: LARGURA_DO_CONTEUDO,
    padding: ESPACO.grande,
    borderRadius: RAIO.medio,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    backgroundColor: CORES.superficie,
    gap: ESPACO.medio,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.pequeno },
  descricao: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: ESPACO.pequeno },
  marcador: { width: 6, height: 6, borderRadius: RAIO.pilula, backgroundColor: CORES.acaoRega },
  quando: { fontFamily: FONTES.forte, fontSize: 15, color: CORES.texto },
  erro: { color: CORES.erro },
});

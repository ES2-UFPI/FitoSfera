import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlantaNoJardim } from '@/aplicacao/casos-de-uso/PlantaNoJardim';
import { BotaoVoltar } from '../componentes/BotaoVoltar';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { EstadoDoPainel, PainelDeCondicoes } from '../componentes/PainelDeCondicoes';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { TabuaDeMadeira } from '../estante/Prateleira';
import { DesenhoDaPlanta } from '../ilustracao/DesenhoDaPlanta';
import { CORES } from '../tema/cores';
import { ESPACO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';

const PREVIA_DO_PAINEL: EstadoDoPainel = {
  tipo: 'leitura',
  demonstracao: true,
  leitura: {
    umidadePercentual: 58,
    temperaturaCelsius: 24,
    luminosidadeLux: 720,
    medidaEm: new Date(),
  },
};

const SENSOR_INDISPONIVEL: EstadoDoPainel = { tipo: 'indisponivel' };

function estadoDoPainel(item: PlantaNoJardim): EstadoDoPainel {
  if (item.ultimaLeitura !== null) {
    return {
      tipo: 'leitura',
      leitura: item.ultimaLeitura,
      desatualizada: item.leituraDesatualizada,
    };
  }
  return __DEV__ ? PREVIA_DO_PAINEL : SENSOR_INDISPONIVEL;
}

/**
 * Detalhe provisório: a planta grande, o apelido, a espécie e a prévia do painel. A navegação até aqui
 * (#20) está pronta; o conteúdo completo do detalhamento é a US06 (#6), que substitui esta tela.
 */
export function TelaDetalheProvisorio({ id }: { id: string }) {
  const { container } = useAplicativo();
  const margens = useSafeAreaInsets();
  // undefined: carregando; null: não existe; 'falhou': o armazenamento não respondeu.
  const [item, definirItem] = useState<PlantaNoJardim | null | undefined | 'falhou'>(undefined);

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
        <ScrollView contentContainerStyle={estilos.conteudo}>
          <View style={estilos.planta}>
            <DesenhoDaPlanta aparencia={item.planta.aparencia} largura={150} respirando />
            <TabuaDeMadeira estilo={estilos.tabua} />
            <Text style={[TEXTO.titulo, estilos.apelido]} accessibilityRole="header">
              {item.planta.apelido}
            </Text>
            <Text style={estilos.especie}>{item.especie?.nomeComum ?? 'Espécie desconhecida'}</Text>
          </View>
          <PainelDeCondicoes estado={estadoDoPainel(item)} />
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
  texto: { textAlign: 'center', marginTop: ESPACO.medio, paddingHorizontal: ESPACO.folgado },
});

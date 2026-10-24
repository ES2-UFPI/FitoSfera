import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIMITE_DO_HISTORICO_DE_REGAS, RegaDoHistorico } from '@/aplicacao/casos-de-uso/ListarRegasDaPlanta';
import { BotaoVoltar } from '../componentes/BotaoVoltar';
import { descreverQuandoRegou, formatarDataEHora } from '../componentes/CartaoDoHistorico';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { IconeRegador } from '../componentes/IconeRegador';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { CORES } from '../tema/cores';
import { ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'falhou' }
  | { tipo: 'sem-planta' }
  | { tipo: 'pronto'; apelido: string; regas: readonly RegaDoHistorico[] };

/** Quantas regas a lista está mostrando, avisando quando o limite cortou as mais antigas. */
export function resumirQuantidade(quantidade: number): string {
  if (quantidade >= LIMITE_DO_HISTORICO_DE_REGAS) return `As ${LIMITE_DO_HISTORICO_DE_REGAS} regas mais recentes`;
  return quantidade === 1 ? '1 rega registrada' : `${quantidade} regas registradas`;
}

/** As regas anteriores de uma planta, da mais recente para a mais antiga. Aberta pelo detalhe. */
export function TelaHistoricoDeRegas({ id }: { id: string }) {
  const { container, idJardimSelecionado } = useAplicativo();
  const margens = useSafeAreaInsets();
  const [estado, definirEstado] = useState<Estado>({ tipo: 'carregando' });

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
            Histórico de regas
          </Text>
          {estado.tipo === 'pronto' ? <Text style={estilos.apelido}>{estado.apelido}</Text> : null}
        </View>

        {estado.tipo === 'carregando' ? <Text style={TEXTO.corpo}>Buscando as regas da planta…</Text> : null}

        {estado.tipo === 'sem-planta' ? <Text style={TEXTO.subtitulo}>Planta não encontrada</Text> : null}

        {estado.tipo === 'falhou' ? (
          <Text style={[TEXTO.corpo, estilos.erro]} accessibilityRole="alert">
            Não deu para ler o histórico agora.
          </Text>
        ) : null}

        {estado.tipo === 'pronto' && estado.regas.length === 0 ? <SemRegas /> : null}

        {estado.tipo === 'pronto' && estado.regas.length > 0 ? (
          <View style={estilos.lista}>
            <Text style={TEXTO.rotulo}>{resumirQuantidade(estado.regas.length).toUpperCase()}</Text>
            {estado.regas.map(({ rega, diasAtras }) => (
              <View
                key={rega.id}
                style={estilos.item}
                accessible
                accessibilityLabel={`${formatarDataEHora(rega.regadaEm)}, ${descreverQuandoRegou(diasAtras)}.`}
              >
                <View style={estilos.marcador} />
                <Text style={estilos.quando}>{formatarDataEHora(rega.regadaEm)}</Text>
                <Text style={TEXTO.apoio}>{descreverQuandoRegou(diasAtras)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </FundoAconchegante>
  );
}

/** A planta nunca foi regada: nada de lista vazia, e sim o convite para registrar a primeira rega. */
function SemRegas() {
  return (
    <View style={estilos.vazio}>
      <View style={estilos.regador} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <IconeRegador cor={CORES.acaoRega} tamanho={44} />
      </View>
      <Text style={TEXTO.subtitulo} accessibilityRole="header">
        Nenhuma rega registrada
      </Text>
      <Text style={[TEXTO.corpo, estilos.texto]}>
        Toque em “Registrar rega” no detalhe da planta e cada rega passa a aparecer aqui.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  topo: { paddingHorizontal: ESPACO.grande },
  conteudo: { flexGrow: 1, paddingHorizontal: ESPACO.grande, paddingTop: ESPACO.pequeno, gap: ESPACO.grande },
  cabecalho: { gap: ESPACO.minimo },
  apelido: { fontFamily: FONTES.forte, fontSize: 15, color: CORES.textoApoio },
  lista: {
    maxWidth: 520,
    padding: ESPACO.grande,
    borderRadius: RAIO.medio,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    backgroundColor: CORES.superficie,
    gap: ESPACO.medio,
  },
  item: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: ESPACO.pequeno },
  marcador: { width: 6, height: 6, borderRadius: RAIO.pilula, backgroundColor: CORES.acaoRega },
  quando: { fontFamily: FONTES.forte, fontSize: 15, color: CORES.texto },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: ESPACO.pequeno, paddingBottom: ESPACO.folgado * 2 },
  regador: { marginBottom: ESPACO.pequeno },
  texto: { textAlign: 'center', maxWidth: 300 },
  erro: { color: CORES.erro },
});

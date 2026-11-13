import { StyleSheet, Text, View } from 'react-native';
import { ColheitasDaPlanta, DIAS_DO_INDICADOR_DE_RENDIMENTO } from '@/aplicacao/casos-de-uso/ObterColheitasDaPlanta';
import { UNIDADES_DE_COLHEITA } from '@/dominio/modelos/RegistroDeColheita';
import { TEXTOS } from '@/textos';
import { formatarData } from '../formatarData';
import { CORES, ESPACO, FONTES, RAIO, TEXTO } from '../tema';
import { Cartao } from '../componentes/Cartao';
import { descreverQuantidade } from './FormularioDeColheita';
import { MensagemDeVazio } from '../componentes/MensagemDeVazio';

/** undefined: carregando. */
export type EstadoDasColheitas = ColheitasDaPlanta | undefined | 'falhou';

/** O indicador do período: uma linha por medida que teve colheita, ou o aviso de que não houve nenhuma. */
function Indicador({ colheitas }: { colheitas: ColheitasDaPlanta }) {
  const linhas = UNIDADES_DE_COLHEITA.map((unidade) => colheitas.rendimento[unidade])
    .filter((rendimento) => rendimento.numeroDeColheitas > 0)
    .map((rendimento) =>
      TEXTOS.colheitas.rendimentoDaMedida(
        descreverQuantidade({ quantidade: rendimento.quantidadeTotal, unidade: rendimento.unidade }),
        rendimento.numeroDeColheitas,
      ),
    );
  const rotulo = TEXTOS.colheitas.rotuloDoIndicador(DIAS_DO_INDICADOR_DE_RENDIMENTO);
  const conteudo = linhas.length > 0 ? linhas : [TEXTOS.colheitas.nadaNoPeriodo(DIAS_DO_INDICADOR_DE_RENDIMENTO)];

  return (
    <View
      style={estilos.indicador}
      accessible
      accessibilityLabel={`${rotulo.toLowerCase()}: ${conteudo.join('; ')}`}
      testID="indicador-de-rendimento"
    >
      <Text style={TEXTO.rotulo}>{rotulo}</Text>
      {linhas.length > 0 ? (
        linhas.map((linha) => (
          <Text key={linha} style={estilos.total}>
            {linha}
          </Text>
        ))
      ) : (
        <Text style={TEXTO.corpo}>{conteudo[0]}</Text>
      )}
    </View>
  );
}

/**
 * O histórico de colheitas da planta, da mais recente para a mais antiga, com o indicador de rendimento do último
 * mês. Puramente visual: recebe as colheitas já lidas pela tela.
 */
export function CartaoDasColheitas({ estado }: { estado: EstadoDasColheitas }) {
  return (
    <Cartao>
      <Text style={TEXTO.subtitulo} accessibilityRole="header">
        {TEXTOS.colheitas.titulo}
      </Text>

      {estado === undefined ? <Text style={TEXTO.apoio}>{TEXTOS.colheitas.carregando}</Text> : null}
      {estado === 'falhou' ? (
        <Text style={[TEXTO.corpo, estilos.erro]} accessibilityRole="alert">
          {TEXTOS.colheitas.falha}
        </Text>
      ) : null}

      {estado !== undefined && estado !== 'falhou' && estado.registros.length === 0 ? (
        <MensagemDeVazio titulo={TEXTOS.colheitas.vazio} texto={TEXTOS.colheitas.comoComecar} testID="colheitas-vazias" />
      ) : null}

      {estado !== undefined && estado !== 'falhou' && estado.registros.length > 0 ? (
        <>
          <Indicador colheitas={estado} />
          <View style={estilos.lista}>
            <Text style={TEXTO.rotulo}>{TEXTOS.colheitas.rotuloDaLista}</Text>
            {estado.registros.map((registro) => {
              const data = formatarData(registro.colhidaEm) ?? TEXTOS.historico.dataDesconhecida;
              const quantidade = descreverQuantidade(registro);
              return (
                <View
                  key={registro.id}
                  style={estilos.item}
                  accessible
                  accessibilityLabel={TEXTOS.colheitas.itemFalado(data, quantidade)}
                  testID="item-de-colheita"
                >
                  <View style={estilos.marcador} />
                  <Text style={TEXTO.corpo}>{TEXTOS.colheitas.itemDaLista(data, quantidade)}</Text>
                </View>
              );
            })}
          </View>
        </>
      ) : null}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  indicador: {
    gap: ESPACO.fino,
    padding: ESPACO.medio,
    borderRadius: RAIO.medio,
    backgroundColor: CORES.papel,
  },
  total: { fontFamily: FONTES.forte, fontSize: 16, color: CORES.texto },
  lista: { gap: ESPACO.pequeno },
  item: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.pequeno },
  marcador: { width: 6, height: 6, borderRadius: RAIO.pilula, backgroundColor: CORES.acao },
  erro: { color: CORES.erro },
});

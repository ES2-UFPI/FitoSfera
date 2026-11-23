import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HistoricoDaPlanta } from '@/aplicacao/casos-de-uso/ObterHistoricoDaPlanta';
import { TEXTOS } from '@/textos';
import { dataLegivel } from '../formatarData';
import { CORES, ESPACO, FONTES, RAIO, TEXTO } from '../tema';
import { Cartao } from './Cartao';
import {
  descreverProximaRega,
  descreverQuandoRegou,
  descreverTempoDesdeOPlantio,
  descreverTempoNoJardim,
} from './textosDoHistorico';

export type EstadoDoHistorico = HistoricoDaPlanta | undefined | 'falhou';

/**
 * Com a data do plantio informada, ela vem no lugar do cadastro: uma muda plantada há meses e cadastrada hoje não
 * "chegou hoje", e as colheitas anteriores ao cadastro deixam de parecer impossíveis.
 */
function LinhaDaIdade({ historico }: { historico: HistoricoDaPlanta }) {
  if (historico.plantadaEm !== null) {
    return (
      <Linha
        rotulo={TEXTOS.historico.plantadaEm}
        valor={dataLegivel(historico.plantadaEm)}
        detalhe={historico.diasDesdeOPlantio !== null ? descreverTempoDesdeOPlantio(historico.diasDesdeOPlantio) : undefined}
      />
    );
  }
  return (
    <Linha
      rotulo={TEXTOS.historico.noJardimDesde}
      valor={historico.cadastradaEm ? dataLegivel(historico.cadastradaEm) : TEXTOS.comum.dataDesconhecida}
      detalhe={historico.diasNoJardim !== null ? descreverTempoNoJardim(historico.diasNoJardim) : undefined}
    />
  );
}

function Linha({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <View style={estilos.linha} accessible accessibilityLabel={`${rotulo}: ${valor}${detalhe ? `, ${detalhe}` : ''}.`}>
      <Text style={TEXTO.rotulo}>{rotulo.toUpperCase()}</Text>
      <Text style={estilos.valor}>{valor}</Text>
      {detalhe ? <Text style={TEXTO.apoio}>{detalhe}</Text> : null}
    </View>
  );
}

export function CartaoDoHistorico({
  estado,
  children,
  rodape,
}: {
  estado: EstadoDoHistorico;
  children?: ReactNode;
  /** Vai depois das linhas do histórico; o detalhe usa para o atalho do histórico completo. */
  rodape?: ReactNode;
}) {
  return (
    <Cartao>
      <Text style={TEXTO.subtitulo} accessibilityRole="header">
        {TEXTOS.historico.titulo}
      </Text>
      {children}

      {estado === undefined ? <Text style={TEXTO.corpo}>{TEXTOS.historico.buscando}</Text> : null}

      {estado === 'falhou' ? (
        <Text style={[TEXTO.corpo, estilos.erro]} accessibilityRole="alert">
          {TEXTOS.historico.falha}
        </Text>
      ) : null}

      {estado !== undefined && estado !== 'falhou' ? (
        <>
          <LinhaDaIdade historico={estado} />
          <Linha
            rotulo={TEXTOS.historico.ultimaRega}
            valor={
              estado.ultimaRega ? dataLegivel(estado.ultimaRega.regadaEm, { comHora: true }) : TEXTOS.historico.nenhumaRega
            }
            detalhe={
              estado.diasDesdeAUltimaRega !== null
                ? descreverQuandoRegou(estado.diasDesdeAUltimaRega)
                : undefined
            }
          />
          <Linha
            rotulo={TEXTOS.historico.proximaRega}
            valor={
              estado.proximaRega.proximaEm
                ? dataLegivel(estado.proximaRega.proximaEm)
                : TEXTOS.historico.semPrevisao
            }
            detalhe={descreverProximaRega(estado.proximaRega)}
          />
          {estado.regasRecentes.length > 0 ? (
            <View style={estilos.linha}>
              <Text style={TEXTO.rotulo}>{TEXTOS.historico.regasRecentes}</Text>
              {estado.regasRecentes.map((rega) => (
                <View key={rega.id} style={estilos.itemDaLista}>
                  <View style={estilos.marcador} />
                  <Text style={TEXTO.corpo}>{dataLegivel(rega.regadaEm, { comHora: true })}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      {estado !== undefined && estado !== 'falhou' ? rodape : null}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  linha: { gap: ESPACO.fino },
  valor: { fontFamily: FONTES.forte, fontSize: 16, color: CORES.texto },
  itemDaLista: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.pequeno },
  marcador: { width: 6, height: 6, borderRadius: RAIO.pilula, backgroundColor: CORES.acaoRega },
  erro: { color: CORES.erro },
});

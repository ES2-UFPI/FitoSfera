import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HistoricoDaPlanta } from '@/aplicacao/casos-de-uso/ObterHistoricoDaPlanta';
import { SituacaoDaRega } from '@/dominio/regras/ProximaRega';
import { TEXTOS } from '@/textos';
import { formatarData } from '../formatarData';
import { CORES } from '../tema/cores';
import { ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';

export type EstadoDoHistorico = HistoricoDaPlanta | undefined | 'falhou';

/** O quando de uma rega, em tempo relativo: "hoje", "ontem" ou "há N dias". */
export function descreverQuandoRegou(diasAtras: number): string {
  if (diasAtras === 0) return TEXTOS.historico.hoje;
  if (diasAtras === 1) return TEXTOS.historico.ontem;
  return TEXTOS.historico.haDias(diasAtras);
}

/** Quando a próxima rega vence, em tempo relativo. Undefined quando não há prazo para anunciar. */
export function descreverProximaRega({ proximaEm, diasAteAProxima }: SituacaoDaRega): string | undefined {
  if (proximaEm === null || diasAteAProxima === null) return undefined;
  if (diasAteAProxima < 0) {
    return TEXTOS.historico.atrasada(-diasAteAProxima);
  }
  if (diasAteAProxima === 0) return TEXTOS.historico.eHoje;
  return diasAteAProxima === 1 ? TEXTOS.historico.eAmanha : TEXTOS.historico.emDias(diasAteAProxima);
}

export function descreverTempoNoJardim(dias: number): string {
  if (dias === 0) return TEXTOS.historico.chegouHoje;
  return TEXTOS.historico.diasNoJardim(dias);
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
    <View style={estilos.cartao}>
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
          <Linha
            rotulo={TEXTOS.historico.noJardimDesde}
            valor={estado.cadastradaEm ? formatarData(estado.cadastradaEm) ?? TEXTOS.historico.dataDesconhecida : TEXTOS.historico.dataDesconhecida}
            detalhe={estado.diasNoJardim !== null ? descreverTempoNoJardim(estado.diasNoJardim) : undefined}
          />
          <Linha
            rotulo={TEXTOS.historico.ultimaRega}
            valor={
              estado.ultimaRega ? formatarData(estado.ultimaRega.regadaEm, { comHora: true }) ?? TEXTOS.historico.dataDesconhecida : TEXTOS.historico.nenhumaRega
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
                ? formatarData(estado.proximaRega.proximaEm) ?? TEXTOS.historico.dataDesconhecida
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
                  <Text style={TEXTO.corpo}>{formatarData(rega.regadaEm, { comHora: true }) ?? TEXTOS.historico.dataDesconhecida}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      {estado !== undefined && estado !== 'falhou' ? rodape : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    width: '100%',
    maxWidth: 520,
    padding: ESPACO.grande,
    borderRadius: RAIO.medio,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    backgroundColor: CORES.superficie,
    gap: ESPACO.medio,
  },
  linha: { gap: 2 },
  valor: { fontFamily: FONTES.forte, fontSize: 16, color: CORES.texto },
  itemDaLista: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.pequeno },
  marcador: { width: 6, height: 6, borderRadius: RAIO.pilula, backgroundColor: CORES.acaoRega },
  erro: { color: CORES.erro },
});

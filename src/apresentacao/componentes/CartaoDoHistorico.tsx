import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HistoricoDaPlanta } from '@/aplicacao/casos-de-uso/ObterHistoricoDaPlanta';
import { CORES } from '../tema/cores';
import { ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';

export type EstadoDoHistorico = HistoricoDaPlanta | undefined | 'falhou';

function doisDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}

export function formatarData(instante: Date): string {
  return `${doisDigitos(instante.getDate())}/${doisDigitos(instante.getMonth() + 1)}/${instante.getFullYear()}`;
}

export function formatarDataEHora(instante: Date): string {
  return `${formatarData(instante)} às ${doisDigitos(instante.getHours())}:${doisDigitos(instante.getMinutes())}`;
}

/** O quando de uma rega, em tempo relativo: "hoje", "ontem" ou "há N dias". */
export function descreverQuandoRegou(diasAtras: number): string {
  if (diasAtras === 0) return 'hoje';
  if (diasAtras === 1) return 'ontem';
  return `há ${diasAtras} dias`;
}

export function descreverTempoNoJardim(dias: number): string {
  if (dias === 0) return 'chegou hoje';
  return dias === 1 ? 'há 1 dia no jardim' : `há ${dias} dias no jardim`;
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
        Rega e histórico
      </Text>
      {children}

      {estado === undefined ? <Text style={TEXTO.corpo}>Buscando o histórico da planta…</Text> : null}

      {estado === 'falhou' ? (
        <Text style={[TEXTO.corpo, estilos.erro]} accessibilityRole="alert">
          Não deu para ler o histórico agora.
        </Text>
      ) : null}

      {estado !== undefined && estado !== 'falhou' ? (
        <>
          <Linha
            rotulo="No jardim desde"
            valor={estado.cadastradaEm ? formatarData(estado.cadastradaEm) : 'data desconhecida'}
            detalhe={estado.diasNoJardim !== null ? descreverTempoNoJardim(estado.diasNoJardim) : undefined}
          />
          <Linha
            rotulo="Última rega"
            valor={
              estado.ultimaRega ? formatarDataEHora(estado.ultimaRega.regadaEm) : 'nenhuma rega registrada'
            }
            detalhe={
              estado.diasDesdeAUltimaRega !== null
                ? descreverQuandoRegou(estado.diasDesdeAUltimaRega)
                : undefined
            }
          />
          {estado.regasRecentes.length > 0 ? (
            <View style={estilos.linha}>
              <Text style={TEXTO.rotulo}>REGAS RECENTES</Text>
              {estado.regasRecentes.map((rega) => (
                <View key={rega.id} style={estilos.itemDaLista}>
                  <View style={estilos.marcador} />
                  <Text style={TEXTO.corpo}>{formatarDataEHora(rega.regadaEm)}</Text>
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

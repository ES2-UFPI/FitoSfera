import { StyleSheet, Text, View } from 'react-native';
import { StatusDaPlanta } from '@/dominio/regras/StatusDaPlanta';
import { TEXTOS } from '@/textos';
import { APRESENTACAO_DO_STATUS } from '../estante/textosDoStatus';
import { CORES, ESPACO, FONTES, RAIO } from '../tema';

/**
 * O status da planta (ok, atenção, sem dados) do mesmo jeito em todo o app (US07, #40): um ponto na cor do status
 * e o texto, para não depender só da cor.
 *
 * - `pilula`: o selo da tela da planta, com o texto inteiro ("Precisa de atenção").
 * - `miudo`: o da etiqueta de papel da estante, com o texto curto ("atenção") e sem fundo.
 */
export function SeloDeStatus({ status, forma = 'pilula' }: { status: StatusDaPlanta; forma?: 'pilula' | 'miudo' }) {
  const apresentacao = APRESENTACAO_DO_STATUS[status];
  const pilula = forma === 'pilula';
  return (
    <View
      style={pilula ? estilos.pilula : estilos.miudo}
      accessible={pilula}
      accessibilityLabel={pilula ? TEXTOS.detalhe.status(apresentacao.falado) : undefined}
      testID="selo-de-status"
    >
      <View style={[pilula ? estilos.ponto : estilos.pontoMiudo, { backgroundColor: apresentacao.cor }]} />
      <Text style={pilula ? estilos.texto : estilos.textoMiudo}>{pilula ? apresentacao.falado : apresentacao.curto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  pilula: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACO.pequeno,
    paddingVertical: ESPACO.minimo,
    paddingHorizontal: ESPACO.medio,
    borderRadius: RAIO.pilula,
    backgroundColor: CORES.papel,
  },
  ponto: { width: 8, height: 8, borderRadius: RAIO.pilula },
  texto: { fontFamily: FONTES.forte, fontSize: 13, color: CORES.textoDoPapel },
  miudo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ESPACO.minimo },
  pontoMiudo: { width: 7, height: 7, borderRadius: RAIO.pilula },
  textoMiudo: { fontFamily: FONTES.texto, fontSize: 9.5, color: CORES.textoDoPapel },
});

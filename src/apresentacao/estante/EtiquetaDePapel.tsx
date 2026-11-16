import { StyleSheet, Text, View } from 'react-native';
import { StatusDaPlanta } from '@/dominio/regras/StatusDaPlanta';
import { CORES, ESPACO, FONTES, RAIO } from '../tema';
import { SeloDeStatus } from '../componentes/SeloDeStatus';

export type Inclinacao = 'esquerda' | 'direita';

/** Etiqueta de papel kraft pendurada por um fio, levemente torta. Com status, ganha uma segunda linha. */
export function EtiquetaDePapel({
  texto,
  inclinacao,
  status,
}: {
  texto: string;
  inclinacao: Inclinacao;
  status?: StatusDaPlanta;
}) {
  return (
    <View style={estilos.etiqueta}>
      <View style={estilos.fio} />
      <View style={[estilos.papel, { transform: [{ rotate: inclinacao === 'esquerda' ? '-2deg' : '2deg' }] }]}>
        <Text style={estilos.texto} numberOfLines={1}>
          {texto}
        </Text>
        {status ? (
          <View style={estilos.status}>
            <SeloDeStatus status={status} forma="miudo" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: { alignItems: 'center', maxWidth: '100%' },
  fio: { width: 1.5, height: 9, backgroundColor: CORES.madeiraBorda },
  papel: {
    maxWidth: '100%',
    backgroundColor: CORES.papel,
    borderTopLeftRadius: RAIO.fino,
    borderTopRightRadius: RAIO.fino,
    borderBottomLeftRadius: RAIO.pequeno,
    borderBottomRightRadius: RAIO.pequeno,
    paddingHorizontal: ESPACO.curto,
    paddingTop: ESPACO.fino,
    paddingBottom: ESPACO.minimo,
    shadowColor: CORES.sombraDaMadeira,
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  texto: { fontFamily: FONTES.forte, fontSize: 10.5, color: CORES.textoDoPapel },
  status: { marginTop: ESPACO.fino },
});

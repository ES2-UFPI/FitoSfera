import { Pressable, StyleSheet, View } from 'react-native';
import { PlantaNoJardim } from '@/aplicacao/casos-de-uso/PlantaNoJardim';
import { DesenhoDaPlanta } from '../ilustracao/DesenhoDaPlanta';
import { EstadoVisual, SEM_DADOS } from '../ilustracao/estadoVisual';
import { ALTURA_DA_AREA_DOS_VASOS, ALTURA_DA_TABUA, LARGURA_DO_VASO } from '../tema/medidas';
import { EtiquetaDePapel, Inclinacao } from './EtiquetaDePapel';

interface Props {
  item: PlantaNoJardim;
  fase: number;
  inclinacao: Inclinacao;
  aoTocar: () => void;
  /** Ponto de extensão do estado de cuidado: hoje sempre "sem dados". */
  estado?: EstadoVisual;
}

/** Uma planta na estante: o desenho em cima da madeira e a etiqueta com o apelido logo abaixo. */
export function VasoNaEstante({ item, fase, inclinacao, aoTocar, estado = SEM_DADOS }: Props) {
  const { apelido, aparencia } = item.planta;
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={`${apelido}. Toque para ver os detalhes.`}
      style={({ pressed }) => [estilos.lugar, pressed && estilos.pressionado]}
    >
      <View style={estilos.areaDoVaso}>
        <DesenhoDaPlanta aparencia={aparencia} largura={LARGURA_DO_VASO} estado={estado} respirando fase={fase} />
      </View>
      <View style={estilos.tabua} />
      <EtiquetaDePapel texto={apelido} inclinacao={inclinacao} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  lugar: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  pressionado: { opacity: 0.8 },
  areaDoVaso: { height: ALTURA_DA_AREA_DOS_VASOS, justifyContent: 'flex-end' },
  tabua: { height: ALTURA_DA_TABUA },
});

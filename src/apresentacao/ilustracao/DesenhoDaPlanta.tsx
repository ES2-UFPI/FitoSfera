import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg from 'react-native-svg';
import { Aparencia } from '@/dominio/modelos/Aparencia';
import { EstadoVisual, SEM_DADOS } from './estadoVisual';
import { DESENHOS_DAS_FORMAS, RamosPendentes } from './formas';
import { coresDaPlanta } from './paletas';
import { useRespiracao } from './useRespiracao';
import { Vaso } from './Vaso';

/** Proporção do desenho inteiro (planta + vaso) em relação à largura. */
export const PROPORCAO_DO_DESENHO = 1.7;

interface Props {
  aparencia: Aparencia;
  largura: number;
  estado?: EstadoVisual;
  respirando?: boolean;
  fase?: number;
}

/**
 * O único componente que desenha uma planta. Estante, cadastro e detalhe usam este, então trocar o
 * desenho por uma foto no futuro é uma mudança só aqui.
 *
 * Camadas, de baixo para cima: a planta (que respira a partir da base), o vaso e, na forma
 * pendente, os ramos que caem por cima do vaso.
 */
export function DesenhoDaPlanta({ aparencia, largura, estado = SEM_DADOS, respirando = false, fase = 0 }: Props) {
  const cores = coresDaPlanta(aparencia);
  const Forma = DESENHOS_DAS_FORMAS[aparencia.forma];
  const respiracao = useRespiracao(fase, respirando);
  const altura = largura * PROPORCAO_DO_DESENHO;

  return (
    <View testID={`desenho-${aparencia.forma}`} style={{ width: largura, height: altura }} pointerEvents="none">
      <Animated.View style={[estilos.camada, estilos.origemNaBase, { width: largura, height: largura }, respiracao]}>
        <View style={[estilos.preencher, ajusteDoEstado(estado)]}>
          <Svg width={largura} height={largura} viewBox="0 0 100 100" style={estilos.semCorte}>
            <Forma cores={cores} />
          </Svg>
        </View>
      </Animated.View>

      <View style={[estilos.camada, { top: largura * 0.96, width: largura, height: largura * 0.7 }]}>
        <Svg width={largura} height={largura * 0.7} viewBox="0 0 100 70">
          <Vaso corpo={cores.corpoDoVaso} borda={cores.bordaDoVaso} />
        </Svg>
      </View>

      {aparencia.forma === 'pendente' ? (
        <View testID="ramos-pendentes" style={[estilos.camada, { width: largura, height: altura }]}>
          <Svg width={largura} height={altura} viewBox="0 0 100 170">
            <RamosPendentes cores={cores} />
          </Svg>
        </View>
      ) : null}
    </View>
  );
}

/** Ponto de extensão do estado de cuidado: hoje só existe "sem dados", que não altera o desenho. */
function ajusteDoEstado(estado: EstadoVisual): ViewStyle {
  switch (estado.tipo) {
    case 'sem-dados':
      return {};
    // Com medição, entram aqui "com sede" (murcha) e "pouca luz" (pálida e inclinada),
    // como no mockup decisao-final.html.
    default: {
      const naoTratado: never = estado.tipo;
      return naoTratado;
    }
  }
}

const estilos = StyleSheet.create({
  camada: { position: 'absolute', left: 0, top: 0, overflow: 'visible' },
  origemNaBase: { transformOrigin: '50% 100%' },
  preencher: { flex: 1 },
  semCorte: { overflow: 'visible' },
});

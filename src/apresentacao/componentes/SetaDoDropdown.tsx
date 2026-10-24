import { ColorValue, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CORES } from '../tema/cores';

/**
 * A seta de um cartão que abre e fecha: aponta para baixo fechado e para cima aberto. É desenhada em SVG, e não
 * com um caractere como "⌄", que não existe nas fontes do app e some no celular.
 */
export function SetaDoDropdown({
  aberto,
  cor = CORES.acao,
  tamanho = 22,
}: {
  aberto: boolean;
  cor?: ColorValue;
  tamanho?: number;
}) {
  return (
    <View
      testID={aberto ? 'seta-para-cima' : 'seta-para-baixo'}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ transform: [{ rotate: aberto ? '180deg' : '0deg' }] }}
    >
      <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
        <Path
          d="M6 9 L12 15 L18 9"
          stroke={cor}
          strokeWidth={2.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

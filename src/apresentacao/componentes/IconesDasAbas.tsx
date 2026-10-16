import { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface PropsDoIcone {
  cor: ColorValue;
  tamanho?: number;
}

const traco = { fill: 'none', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function IconeJardim({ cor, tamanho = 22 }: PropsDoIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d="M4 20 C4 10 10 4 20 4 C20 14 14 20 4 20 Z M4 20 L13 11" stroke={cor} {...traco} />
    </Svg>
  );
}

export function IconeAmbiente({ cor, tamanho = 22 }: PropsDoIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d="M7 18 A4 4 0 0 1 7 10 A5 5 0 0 1 16.5 8.5 A4.5 4.5 0 0 1 17 18 Z" stroke={cor} {...traco} />
    </Svg>
  );
}

export function IconeAjustes({ cor, tamanho = 22 }: PropsDoIcone) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke={cor} {...traco} />
      <Circle cx={16} cy={7} r={2} stroke={cor} {...traco} />
      <Circle cx={10} cy={17} r={2} stroke={cor} {...traco} />
    </Svg>
  );
}

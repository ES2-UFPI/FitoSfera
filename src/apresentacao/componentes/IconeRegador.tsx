import { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
  readonly cor: ColorValue;
  readonly tamanho?: number;
  readonly testID?: string;
}

const traco = {
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** Regador de contorno simples, usado para diferenciar a ação de regar da medição de umidade. */
export function IconeRegador({ cor, tamanho = 24, testID }: Props) {
  return (
    <Svg testID={testID} width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d="M5 10 H15 V18.5 C15 19.3 14.3 20 13.5 20 H6.5 C5.7 20 5 19.3 5 18.5 Z" stroke={cor} {...traco} />
      <Path d="M5 12 C1.5 10.5 1.5 18 5 17" stroke={cor} {...traco} />
      <Path d="M15 12 L20 8 L22 10 L16 15" stroke={cor} {...traco} />
      <Path d="M8 10 V8.5 C8 6.6 9.6 5 11.5 5 C13.4 5 15 6.6 15 8.5 V10" stroke={cor} {...traco} />
    </Svg>
  );
}

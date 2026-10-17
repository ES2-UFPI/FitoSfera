import { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

interface PropsDoIcone {
  readonly cor: ColorValue;
  readonly tamanho?: number;
  readonly testID?: string;
}

const traco = { fill: 'none', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Gota de contorno orgânico, seguindo o mesmo traço arredondado dos ícones das abas. */
export function IconeUmidade({ cor, tamanho = 27, testID }: PropsDoIcone) {
  return (
    <Svg testID={testID} width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d="M12 3.5 C12 3.5 6.5 10 6.5 14.5 A5.5 5.5 0 0 0 17.5 14.5 C17.5 10 12 3.5 12 3.5 Z" stroke={cor} {...traco} />
      <Path d="M9.5 15.5 C10 17 11 17.7 12.5 17.8" stroke={cor} {...traco} />
    </Svg>
  );
}

/** Termômetro simples, legível mesmo no tamanho reduzido dos cartões. */
export function IconeTemperatura({ cor, tamanho = 27, testID }: PropsDoIcone) {
  return (
    <Svg testID={testID} width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path
        d="M12 3 A3 3 0 0 0 9 6 V13.2 A5 5 0 1 0 15 13.2 V6 A3 3 0 0 0 12 3 Z M12 7 V16"
        stroke={cor}
        {...traco}
      />
      <Circle cx={12} cy={16} r={1.8} fill={cor} />
    </Svg>
  );
}

/** Sol com raios curtos, inspirado no sol amarelo da marca. */
export function IconeLuz({ cor, tamanho = 27, testID }: PropsDoIcone) {
  return (
    <Svg testID={testID} width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={4} stroke={cor} {...traco} />
      <Path
        d="M12 2.5 V5 M12 19 V21.5 M2.5 12 H5 M19 12 H21.5 M5.3 5.3 L7 7 M17 17 L18.7 18.7 M18.7 5.3 L17 7 M7 17 L5.3 18.7"
        stroke={cor}
        {...traco}
      />
    </Svg>
  );
}

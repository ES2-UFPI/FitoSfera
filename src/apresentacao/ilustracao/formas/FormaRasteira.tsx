import { Circle, G, Path } from 'react-native-svg';
import { CORES_FIXAS_DO_DESENHO } from '../paletas';
import { PropsDaForma } from './pecas';

/** Folhas redondas e frutos pendentes (morango...). */
export function FormaRasteira({ cores }: PropsDaForma) {
  return (
    <G>
      <G stroke={cores.haste} strokeWidth={2.6} fill="none" strokeLinecap="round">
        <Path d="M50 100 Q40 70 28 52" />
        <Path d="M50 100 Q60 70 72 50" />
        <Path d="M50 100 V48" />
        <Path d="M48 92 Q30 88 26 76" />
        <Path d="M54 90 Q70 86 76 78" />
      </G>
      <G fill={cores.folha}>
        <Circle cx={24} cy={46} r={11} />
        <Circle cx={50} cy={38} r={12} />
        <Circle cx={76} cy={44} r={11} />
      </G>
      <G fill={cores.folhaClara}>
        <Circle cx={34} cy={40} r={9} />
        <Circle cx={66} cy={38} r={9} />
      </G>
      <G fill={cores.destaque}>
        <Path d="M26 76 C18 76 18 88 26 96 C34 88 34 76 26 76 Z" />
        <Path d="M76 78 C69 78 69 88 76 95 C83 88 83 78 76 78 Z" />
      </G>
      <G fill={CORES_FIXAS_DO_DESENHO.semente}>
        <Circle cx={24} cy={83} r={1} />
        <Circle cx={28} cy={86} r={1} />
        <Circle cx={25} cy={90} r={1} />
        <Circle cx={74} cy={84} r={1} />
        <Circle cx={78} cy={88} r={1} />
      </G>
      <Path
        d="M21 76 Q26 72 31 76 M71 78 Q76 74 81 78"
        stroke={cores.haste}
        strokeWidth={2.4}
        fill="none"
        strokeLinecap="round"
      />
    </G>
  );
}

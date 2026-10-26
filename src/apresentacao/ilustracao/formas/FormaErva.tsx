import { Ellipse, G, Path } from 'react-native-svg';
import { PropsDaForma } from './pecas';

/** Moita de folhas arredondadas (manjericão, hortelã...). Não tem destaque. */
export function FormaErva({ cores }: PropsDaForma) {
  return (
    <G>
      <G stroke={cores.haste} strokeWidth={3} fill="none" strokeLinecap="round">
        <Path d="M50 100 V30" />
        <Path d="M50 84 Q40 74 30 68" />
        <Path d="M50 72 Q62 62 72 56" />
        <Path d="M50 56 Q42 48 36 40" />
        <Path d="M50 48 Q58 42 63 36" />
      </G>
      <G fill={cores.folha}>
        <Ellipse cx={27} cy={66} rx={14} ry={8.5} transform="rotate(-25 27 66)" />
        <Ellipse cx={75} cy={54} rx={14} ry={8.5} transform="rotate(25 75 54)" />
        <Ellipse cx={33} cy={38} rx={12} ry={7.5} transform="rotate(-40 33 38)" />
        <Ellipse cx={65} cy={34} rx={12} ry={7.5} transform="rotate(38 65 34)" />
      </G>
      <G fill={cores.folhaClara}>
        <Ellipse cx={50} cy={22} rx={9} ry={14} />
        <Ellipse cx={66} cy={78} rx={13} ry={7.5} transform="rotate(20 66 78)" />
        <Ellipse cx={35} cy={88} rx={12} ry={6.5} transform="rotate(-15 35 88)" />
      </G>
    </G>
  );
}

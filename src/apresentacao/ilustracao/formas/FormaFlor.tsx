import { Circle, G, Path } from 'react-native-svg';
import { CORES_FIXAS_DO_DESENHO } from '../paletas';
import { FlorDeCincoPetalas, FolhaPontuda, PropsDaForma } from './pecas';

/** Três hastes com flores de cinco pétalas e miolo amarelo. */
export function FormaFlor({ cores }: PropsDaForma) {
  return (
    <G>
      <G stroke={cores.haste} strokeWidth={2.6} fill="none" strokeLinecap="round">
        <Path d="M50 100 Q48 70 50 30" />
        <Path d="M50 100 Q36 74 27 46" />
        <Path d="M50 100 Q64 74 73 44" />
      </G>
      <G fill={cores.folha}>
        <FolhaPontuda transform="translate(50 97) rotate(-165) scale(1.15)" />
        <FolhaPontuda transform="translate(50 97) rotate(-15) scale(1.15)" />
        <FolhaPontuda transform="translate(50 92) rotate(-135) scale(.9)" />
        <FolhaPontuda transform="translate(50 92) rotate(-45) scale(.9)" />
      </G>
      <G fill={cores.destaque}>
        <FlorDeCincoPetalas transform="translate(50 24)" />
        <FlorDeCincoPetalas transform="translate(26 42) scale(.85)" />
        <FlorDeCincoPetalas transform="translate(74 40) scale(.85)" />
      </G>
      <G fill={CORES_FIXAS_DO_DESENHO.miolo}>
        <Circle cx={50} cy={24} r={4.2} />
        <Circle cx={26} cy={42} r={3.6} />
        <Circle cx={74} cy={40} r={3.6} />
      </G>
    </G>
  );
}

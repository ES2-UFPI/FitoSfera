import { Circle, G, Path } from 'react-native-svg';
import { CORES_FIXAS_DO_DESENHO } from '../paletas';
import { FolhaPontuda, PropsDaForma } from './pecas';

/** Haste com folhas pontudas e três frutos redondos (tomate, pimenta, pimentão...). */
export function FormaFrutifera({ cores }: PropsDaForma) {
  return (
    <G>
      <G stroke={cores.haste} strokeWidth={3.5} fill="none" strokeLinecap="round">
        <Path d="M50 100 Q47 60 52 6" />
        <Path d="M50 76 Q36 70 22 56" />
        <Path d="M50 54 Q64 48 78 34" />
        <Path d="M51 32 Q40 24 32 12" />
      </G>
      <G fill={cores.folha}>
        <FolhaPontuda transform="translate(22 56) rotate(-150) scale(.9)" />
        <FolhaPontuda transform="translate(30 64) rotate(-200) scale(.7)" />
        <FolhaPontuda transform="translate(78 34) rotate(-30) scale(.9)" />
        <FolhaPontuda transform="translate(68 44) rotate(20) scale(.7)" />
        <FolhaPontuda transform="translate(32 12) rotate(-140) scale(.75)" />
        <FolhaPontuda transform="translate(52 8) rotate(-70) scale(.6)" />
      </G>
      <G fill={cores.destaque}>
        <Circle cx={36} cy={80} r={9} />
        <Circle cx={62} cy={66} r={8} />
        <Circle cx={58} cy={87} r={7} />
      </G>
      <G fill={CORES_FIXAS_DO_DESENHO.brilho} opacity={0.35}>
        <Circle cx={33} cy={77} r={2.4} />
        <Circle cx={59} cy={63} r={2.2} />
        <Circle cx={56} cy={85} r={1.8} />
      </G>
      <Path
        d="M36 71 l-3 3 M36 71 l3 3 M62 58 l-3 3 M62 58 l3 3"
        stroke={cores.haste}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </G>
  );
}

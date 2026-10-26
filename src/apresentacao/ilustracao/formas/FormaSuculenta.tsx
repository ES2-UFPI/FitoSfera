import { Circle, G } from 'react-native-svg';
import { FolhaPontuda, PropsDaForma } from './pecas';

/** Roseta de folhas carnudas. O destaque pinta pontinhos nas folhas. */
export function FormaSuculenta({ cores }: PropsDaForma) {
  return (
    <G>
      <G fill={cores.folha}>
        <FolhaPontuda transform="translate(50 96) rotate(-175) scale(1.35)" />
        <FolhaPontuda transform="translate(50 96) rotate(-5) scale(1.35)" />
        <FolhaPontuda transform="translate(50 96) rotate(-140) scale(1.3)" />
        <FolhaPontuda transform="translate(50 96) rotate(-40) scale(1.3)" />
      </G>
      <G fill={cores.folhaClara}>
        <FolhaPontuda transform="translate(50 96) rotate(-115) scale(1.25)" />
        <FolhaPontuda transform="translate(50 96) rotate(-65) scale(1.25)" />
        <FolhaPontuda transform="translate(50 96) rotate(-90) scale(1.15)" />
      </G>
      <G fill={cores.destaque}>
        <Circle cx={13} cy={92} r={3} />
        <Circle cx={87} cy={92} r={3} />
        <Circle cx={23} cy={69} r={2.8} />
        <Circle cx={77} cy={69} r={2.8} />
        <Circle cx={38} cy={58} r={2.6} />
        <Circle cx={62} cy={58} r={2.6} />
        <Circle cx={50} cy={63} r={2.6} />
      </G>
    </G>
  );
}

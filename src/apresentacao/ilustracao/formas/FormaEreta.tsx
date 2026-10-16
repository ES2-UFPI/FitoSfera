import { G, Path } from 'react-native-svg';
import { PropsDaForma } from './pecas';

/** Folhas em espada (espada-de-são-jorge...). O destaque pinta o contorno das folhas. */
export function FormaEreta({ cores }: PropsDaForma) {
  return (
    <G stroke={cores.destaque} strokeWidth={2.4} strokeLinejoin="round">
      <G fill={cores.folha}>
        <Path d="M40 100 C33 80 24 60 15 34 C30 54 40 76 48 100 Z" />
        <Path d="M52 100 C56 72 64 46 78 18 C73 50 66 76 62 100 Z" />
        <Path d="M44 100 C36 70 35 40 41 4 C49 36 53 70 53 100 Z" />
      </G>
      <Path d="M50 100 C50 82 54 64 60 44 C61 66 59 84 58 100 Z" fill={cores.folhaClara} />
    </G>
  );
}

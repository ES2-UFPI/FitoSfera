import { G, Path } from 'react-native-svg';
import { FolhaCoracao, PropsDaForma } from './pecas';

/** Moita de folhas de coração (jiboia...). Os ramos que caem sobre o vaso ficam em `RamosPendentes`. */
export function FormaPendente({ cores }: PropsDaForma) {
  return (
    <G>
      <G fill={cores.folha}>
        <FolhaCoracao transform="translate(50 52) rotate(180) scale(1.5)" />
        <FolhaCoracao transform="translate(30 66) rotate(140) scale(1.35)" />
        <FolhaCoracao transform="translate(70 64) rotate(-140) scale(1.35)" />
      </G>
      <G fill={cores.folhaClara}>
        <FolhaCoracao transform="translate(40 50) rotate(160) scale(1.25)" />
        <FolhaCoracao transform="translate(62 46) rotate(-160) scale(1.2)" />
        <FolhaCoracao transform="translate(50 82) rotate(180) scale(1.3)" />
      </G>
    </G>
  );
}

/** Ramos que descem por cima do vaso, no espaço 100 × 170 do desenho inteiro. */
export function RamosPendentes({ cores }: PropsDaForma) {
  return (
    <G>
      <G fill="none" stroke={cores.folha} strokeWidth={2.4} strokeLinecap="round">
        <Path d="M22 96 Q10 120 16 150" />
        <Path d="M80 96 Q92 118 86 140" />
      </G>
      <G fill={cores.folhaClara}>
        <FolhaCoracao transform="translate(15 118) rotate(20)" />
        <FolhaCoracao transform="translate(17 142) rotate(-10) scale(1.1)" />
        <FolhaCoracao transform="translate(89 114) rotate(-25)" />
        <FolhaCoracao transform="translate(86 134) rotate(10) scale(.95)" />
      </G>
    </G>
  );
}

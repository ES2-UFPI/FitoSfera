import { Circle, G, Path } from 'react-native-svg';
import { CoresDaPlanta } from '../paletas';

/** Todas as formas recebem as cores da aparência e desenham no espaço 100 × 100, com a base em (50, 100). */
export type PropsDaForma = { cores: CoresDaPlanta };

/** Folha pontuda de 28 de comprimento, saindo da origem para a direita. A cor vem do grupo pai. */
export function FolhaPontuda({ transform }: { transform: string }) {
  return <Path d="M0 0 C7 -9 21 -9 28 0 C21 9 7 9 0 0 Z" transform={transform} />;
}

/** Folha de coração com 14 de altura, apontando para baixo. A cor vem do grupo pai. */
export function FolhaCoracao({ transform }: { transform: string }) {
  return <Path d="M0 0 C-9 -9 -16 3 0 14 C16 3 9 -9 0 0 Z" transform={transform} />;
}

/** Flor de cinco pétalas centrada em (0, 0). A cor das pétalas vem do grupo pai. */
export function FlorDeCincoPetalas({ transform }: { transform: string }) {
  return (
    <G transform={transform}>
      <Circle cx={0} cy={-7.5} r={6} />
      <Circle cx={7.1} cy={-2.3} r={6} />
      <Circle cx={4.4} cy={6.1} r={6} />
      <Circle cx={-4.4} cy={6.1} r={6} />
      <Circle cx={-7.1} cy={-2.3} r={6} />
    </G>
  );
}

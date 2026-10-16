import { G, Path, Rect } from 'react-native-svg';
import { CORES_FIXAS_DO_DESENHO } from './paletas';

/** Vaso de barro no espaço 100 × 70: corpo afunilado, sombra sob a borda e reflexo na borda. */
export function Vaso({ corpo, borda }: { corpo: string; borda: string }) {
  return (
    <G>
      <Path d="M18 18 H82 L74 65 Q73 70 68 70 H32 Q27 70 26 65 Z" fill={corpo} />
      <Path d="M18 18 H82 L80 29 H20 Z" fill={CORES_FIXAS_DO_DESENHO.sombra} opacity={0.16} />
      <Rect x={10} y={4} width={80} height={16} rx={5} fill={borda} />
      <Rect x={15} y={7} width={38} height={4} rx={2} fill={CORES_FIXAS_DO_DESENHO.brilho} opacity={0.22} />
    </G>
  );
}

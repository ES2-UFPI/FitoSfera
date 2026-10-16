import { Ellipse, G, Path } from 'react-native-svg';
import { CORES_FIXAS_DO_DESENHO } from '../paletas';
import { FolhaPontuda, PropsDaForma } from './pecas';

/** Hastes finas com flores em espiga (lavanda...). */
export function FormaEspiga({ cores }: PropsDaForma) {
  return (
    <G>
      <G stroke={cores.haste} strokeWidth={2.4} fill="none" strokeLinecap="round">
        <Path d="M50 100 V22" />
        <Path d="M50 100 Q40 60 30 30" />
        <Path d="M50 100 Q62 60 72 28" />
        <Path d="M50 100 Q46 70 40 40" />
        <Path d="M50 100 Q56 72 61 42" />
      </G>
      <G fill={cores.destaque}>
        <Ellipse cx={50} cy={10} rx={3} ry={4} />
        <Ellipse cx={50} cy={16} rx={4} ry={5} />
        <Ellipse cx={50} cy={24} rx={4.5} ry={5} />
        <Ellipse cx={50} cy={32} rx={4} ry={4.5} />
        <Ellipse cx={28} cy={18} rx={2.8} ry={3.6} />
        <Ellipse cx={29} cy={24} rx={3.6} ry={4.6} transform="rotate(-18 29 24)" />
        <Ellipse cx={31} cy={32} rx={4} ry={4.6} transform="rotate(-18 31 32)" />
        <Ellipse cx={74} cy={16} rx={2.8} ry={3.6} />
        <Ellipse cx={73} cy={22} rx={3.6} ry={4.6} transform="rotate(18 73 22)" />
        <Ellipse cx={71} cy={30} rx={4} ry={4.6} transform="rotate(18 71 30)" />
        <Ellipse cx={40} cy={36} rx={3.4} ry={4} />
        <Ellipse cx={61} cy={38} rx={3.4} ry={4} />
      </G>
      <G fill={CORES_FIXAS_DO_DESENHO.brilho} opacity={0.3}>
        <Ellipse cx={49} cy={15} rx={1.6} ry={2.4} />
        <Ellipse cx={49} cy={23} rx={1.8} ry={2.4} />
        <Ellipse cx={72} cy={21} rx={1.4} ry={2} />
        <Ellipse cx={28} cy={23} rx={1.4} ry={2} />
      </G>
      <G fill={cores.folhaClara}>
        <FolhaPontuda transform="translate(50 96) rotate(-160) scale(.8)" />
        <FolhaPontuda transform="translate(50 96) rotate(-20) scale(.8)" />
      </G>
    </G>
  );
}

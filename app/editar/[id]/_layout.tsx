import { useLocalSearchParams } from 'expo-router';
import { LayoutDaEdicao } from '@/apresentacao/telas/LayoutDaEdicao';

export default function RotaLayoutDaEdicao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LayoutDaEdicao id={id} />;
}

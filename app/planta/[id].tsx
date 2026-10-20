import { useLocalSearchParams } from 'expo-router';
import { TelaDetalheDaPlanta } from '@/apresentacao/telas/TelaDetalheDaPlanta';

export default function RotaPlanta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TelaDetalheDaPlanta id={id} />;
}

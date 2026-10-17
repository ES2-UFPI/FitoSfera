import { useLocalSearchParams } from 'expo-router';
import { TelaDetalheProvisorio } from '@/apresentacao/telas/TelaDetalheProvisorio';

export default function RotaPlanta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TelaDetalheProvisorio id={id} />;
}

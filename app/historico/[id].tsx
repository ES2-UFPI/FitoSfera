import { useLocalSearchParams } from 'expo-router';
import { TelaHistoricoDeRegas } from '@/apresentacao/telas/TelaHistoricoDeRegas';

export default function RotaHistorico() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TelaHistoricoDeRegas id={id} />;
}

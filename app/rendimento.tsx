import { useLocalSearchParams } from 'expo-router';
import { TelaCompararRendimento } from '@/apresentacao/telas/TelaCompararRendimento';

export default function RotaRendimento() {
  const { planta } = useLocalSearchParams<{ planta?: string }>();
  return <TelaCompararRendimento idInicial={planta} />;
}

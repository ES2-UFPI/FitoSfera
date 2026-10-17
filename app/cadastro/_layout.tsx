import { Stack } from 'expo-router';
import { ProvedorDoRascunho } from '@/apresentacao/contextos/RascunhoDoCadastro';
import { CORES } from '@/apresentacao/tema/cores';

export default function LayoutDoCadastro() {
  return (
    <ProvedorDoRascunho>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: CORES.fundoTopo } }} />
    </ProvedorDoRascunho>
  );
}

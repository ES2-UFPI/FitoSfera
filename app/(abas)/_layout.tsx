import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconeAjustes, IconeAmbiente, IconeJardim } from '@/apresentacao/componentes/IconesDasAbas';
import { CORES } from '@/apresentacao/tema/cores';
import { ALTURA_DA_BARRA_DE_ABAS } from '@/apresentacao/tema/medidas';
import { FONTES } from '@/apresentacao/tema/tipografia';

export default function LayoutDasAbas() {
  const margens = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: CORES.acao,
        tabBarInactiveTintColor: CORES.abaInativa,
        tabBarStyle: {
          backgroundColor: CORES.barraDeAbas,
          borderTopColor: CORES.bordaDaBarra,
          height: ALTURA_DA_BARRA_DE_ABAS + margens.bottom,
          paddingBottom: margens.bottom,
        },
        tabBarLabelStyle: { fontFamily: FONTES.forte, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Jardim', tabBarIcon: ({ color }) => <IconeJardim cor={color} /> }} />
      <Tabs.Screen
        name="ambiente"
        options={{ title: 'Ambiente', tabBarIcon: ({ color }) => <IconeAmbiente cor={color} /> }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{ title: 'Ajustes', tabBarIcon: ({ color }) => <IconeAjustes cor={color} /> }}
      />
    </Tabs>
  );
}

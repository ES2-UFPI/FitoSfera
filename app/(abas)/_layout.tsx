import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconeAjustes, IconeJardim } from '@/apresentacao/componentes/IconesDasAbas';
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
      {/*
        A aba Ambiente está escondida enquanto a tela é só "Em breve". O arquivo app/(abas)/ambiente.tsx continua no
        projeto; para mostrar a aba de novo, troque o Tabs.Screen de baixo por este e volte a importar IconeAmbiente:

        <Tabs.Screen
          name="ambiente"
          options={{ title: 'Ambiente', tabBarIcon: ({ color }) => <IconeAmbiente cor={color} /> }}
        />
      */}
      {/* O expo-router cria uma aba para cada arquivo da pasta: href null tira esta da barra. */}
      <Tabs.Screen name="ambiente" options={{ href: null }} />
      <Tabs.Screen
        name="ajustes"
        options={{ title: 'Ajustes', tabBarIcon: ({ color }) => <IconeAjustes cor={color} /> }}
      />
    </Tabs>
  );
}

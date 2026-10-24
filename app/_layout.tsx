import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Nunito_700Bold, Nunito_700Bold_Italic, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CamadaDaAbertura } from '@/apresentacao/abertura/CamadaDaAbertura';
import { ProvedorDoAplicativo, useAplicativo } from '@/apresentacao/contextos/ContextoDoAplicativo';
import { useAberturaPelaNotificacao } from '@/apresentacao/notificacoes/useAberturaPelaNotificacao';
import { ligarVerificacaoEmSegundoPlano } from '@/composicao/verificacaoEmSegundoPlano';
import { CORES } from '@/apresentacao/tema/cores';

// O splash nativo (fundo creme) segura a tela até as fontes chegarem.
void SplashScreen.preventAutoHideAsync();

export default function LayoutRaiz() {
  const [fontesProntas, erroDasFontes] = useFonts({
    Fraunces_600SemiBold,
    Nunito_700Bold,
    Nunito_700Bold_Italic,
    Nunito_800ExtraBold,
  });

  // Se as fontes falharem, o app abre com a fonte do sistema em vez de ficar preso no splash.
  const podeAbrir = fontesProntas || erroDasFontes !== null;

  useEffect(() => {
    if (podeAbrir) void SplashScreen.hideAsync();
  }, [podeAbrir]);

  if (!podeAbrir) return null;

  return (
    <SafeAreaProvider>
      <ProvedorDoAplicativo>
        <StatusBar style="dark" />
        <Navegacao />
      </ProvedorDoAplicativo>
    </SafeAreaProvider>
  );
}

/** As telas do app e, por cima, a abertura, que espera a animação e o jardim carregar. */
function Navegacao() {
  const { plantas, container } = useAplicativo();

  // Na primeira abertura é aqui que o app pede a permissão de notificação.
  useEffect(() => {
    void ligarVerificacaoEmSegundoPlano(container);
  }, [container]);

  // Tocar na notificação de desvio abre o detalhe da planta citada.
  useAberturaPelaNotificacao();

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: CORES.fundoTopo } }}>
        <Stack.Screen name="(abas)" />
        <Stack.Screen name="cadastro" options={{ presentation: 'modal' }} />
        <Stack.Screen name="planta/[id]" />
        <Stack.Screen name="editar/[id]" options={{ presentation: 'modal' }} />
      </Stack>
      <CamadaDaAbertura jardimCarregado={plantas !== null} />
    </>
  );
}

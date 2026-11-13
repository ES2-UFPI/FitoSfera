import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { JANELA_PADRAO, JanelaDeLembretes } from '@/dominio/modelos/JanelaDeLembretes';
import { TEXTOS } from '@/textos';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { CORES } from '../tema/cores';
import { ESPACO, RAIO } from '../tema/medidas';
import { TEXTO } from '../tema/tipografia';
import { descreverJanela } from './textosDosLembretes';

/** undefined: ainda lendo a preferência gravada. */
type EstadoDoCartao = JanelaDeLembretes | undefined;

/**
 * O horário gravado, nos Ajustes, com o caminho para a tela que o muda. `emDestaque` diz se o botão é a ação
 * principal da tela; os Ajustes tiram o destaque quando falta parear o sensor, que passa a ser o mais urgente.
 */
export function CartaoDosLembretes({ emDestaque = true }: { emDestaque?: boolean }) {
  const { container } = useAplicativo();
  const navegador = useRouter();
  const [janela, definirJanela] = useState<EstadoDoCartao>(undefined);

  // Relê ao voltar da tela de horário: sem isto, o cartão mostraria a janela antiga até o app reabrir.
  useFocusEffect(
    useCallback(() => {
      let atual = true;
      container.ajustarPreferencias.obterJanelaDeLembretes().then(
        (lida) => atual && definirJanela(lida),
        () => atual && definirJanela(JANELA_PADRAO),
      );
      return () => {
        atual = false;
      };
    }, [container]),
  );

  return (
    <View style={estilos.cartao}>
      <Text style={TEXTO.subtitulo} accessibilityRole="header">
        {TEXTOS.lembretes.titulo}
      </Text>
      <Text style={TEXTO.corpo}>
        {janela === undefined
          ? TEXTOS.lembretes.lendo
          : TEXTOS.lembretes.resumo(descreverJanela(janela))}
      </Text>
      {janela === undefined ? null : (
        <BotaoPrincipal
          titulo={TEXTOS.lembretes.mudarHorario}
          variante={emDestaque ? 'padrao' : 'secundaria'}
          aoTocar={() => navegador.push('/lembretes')}
          largo
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    padding: ESPACO.grande,
    gap: ESPACO.grande,
    borderRadius: RAIO.grande,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    backgroundColor: CORES.superficie,
  },
});

import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { PlantaNoJardim } from '@/aplicacao/casos-de-uso/PlantaNoJardim';
import { ALTURA_DA_PRATELEIRA, ESPACO, FOLGA_DO_BOTAO_FLUTUANTE } from '../tema';
import { contarPrateleirasQueCabem, distribuirNaEstante, Lugar, MINIMO_DE_PRATELEIRAS } from './distribuirNaEstante';
import { Prateleira } from './Prateleira';
import { VasoFantasma } from './VasoFantasma';
import { VasoNaEstante } from './VasoNaEstante';

interface Props {
  plantas: readonly PlantaNoJardim[];
  aoAbrirPlanta: (id: string) => void;
  aoCadastrar: () => void;
  atualizando?: boolean;
  aoAtualizar?: () => void;
}

/**
 * Mede o espaço livre, calcula quantas prateleiras cabem e só libera a rolagem quando as
 * prateleiras da tela principal estão todas cheias.
 */
export function Estante({ plantas, aoAbrirPlanta, aoCadastrar, atualizando = false, aoAtualizar }: Props) {
  const [alturaDisponivel, definirAlturaDisponivel] = useState<number | null>(null);
  const prateleirasQueCabem =
    alturaDisponivel === null
      ? MINIMO_DE_PRATELEIRAS
      : contarPrateleirasQueCabem(alturaDisponivel - FOLGA_DO_BOTAO_FLUTUANTE, ALTURA_DA_PRATELEIRA);
  const { prateleiras, rolagemLiberada } = distribuirNaEstante(plantas.length, prateleirasQueCabem);

  function desenharLugar(lugar: Lugar, posicao: number) {
    if (lugar.tipo === 'fantasma') return <VasoFantasma key="fantasma" aoTocar={aoCadastrar} />;
    if (lugar.tipo === 'vazio') return <View key={`vazio-${posicao}`} style={estilos.lugarVazio} />;
    const item = plantas[lugar.indice];
    return (
      <VasoNaEstante
        key={item.planta.id}
        item={item}
        fase={lugar.indice}
        inclinacao={posicao % 2 === 0 ? 'esquerda' : 'direita'}
        aoTocar={() => aoAbrirPlanta(item.planta.id)}
      />
    );
  }

  return (
    <View
      style={estilos.area}
      testID="area-da-estante"
      onLayout={(evento) => definirAlturaDisponivel(evento.nativeEvent.layout.height)}
    >
      <FlatList
        testID="estante"
        data={prateleiras}
        keyExtractor={(_lugares, indice) => String(indice)}
        renderItem={({ item: lugares, index: indiceDaPrateleira }) => (
          <Prateleira>
            {lugares.map((lugar, coluna) => desenharLugar(lugar, indiceDaPrateleira * lugares.length + coluna))}
          </Prateleira>
        )}
        scrollEnabled={rolagemLiberada}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.conteudo}
        refreshControl={
          aoAtualizar ? <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} /> : undefined
        }
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, marginTop: ESPACO.grande },
  conteudo: { paddingHorizontal: ESPACO.medio, paddingBottom: FOLGA_DO_BOTAO_FLUTUANTE },
  lugarVazio: { flex: 1 },
});

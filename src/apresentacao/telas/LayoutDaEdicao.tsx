import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PlantaNoJardim } from '@/aplicacao/casos-de-uso/PlantaNoJardim';
import { BotaoVoltar } from '../componentes/BotaoVoltar';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { ProvedorDoRascunho } from '../contextos/RascunhoDoCadastro';
import { CORES } from '../tema/cores';
import { ESPACO } from '../tema/medidas';
import { TEXTO } from '../tema/tipografia';

/** Abre os passos de aparência e apelido do cadastro já preenchidos com a planta. */
export function LayoutDaEdicao({ id }: { id: string }) {
  const { container } = useAplicativo();
  const [item, definirItem] = useState<PlantaNoJardim | null | undefined | 'falhou'>(undefined);

  useEffect(() => {
    let atual = true;
    container.obterPlanta.executar(id).then(
      (encontrado) => {
        if (atual) definirItem(encontrado);
      },
      (falha) => {
        console.warn('Não deu para ler a planta do armazenamento do aparelho.', falha);
        if (atual) definirItem('falhou');
      },
    );
    return () => {
      atual = false;
    };
  }, [container, id]);

  if (item === undefined) return <FundoAconchegante />;

  if (item === null || item === 'falhou') {
    return (
      <FundoAconchegante style={estilos.tela}>
        <BotaoVoltar />
        <View style={estilos.centro}>
          <Text style={TEXTO.subtitulo}>
            {item === null ? 'Planta não encontrada' : 'Não deu para abrir esta planta agora.'}
          </Text>
        </View>
      </FundoAconchegante>
    );
  }

  return (
    <ProvedorDoRascunho
      inicial={{
        especie: item.especie,
        aparencia: item.planta.aparencia,
        edicao: { idPlanta: item.planta.id, apelido: item.planta.apelido },
      }}
    >
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: CORES.fundoTopo } }} />
    </ProvedorDoRascunho>
  );
}

const estilos = StyleSheet.create({
  tela: { padding: ESPACO.grande },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

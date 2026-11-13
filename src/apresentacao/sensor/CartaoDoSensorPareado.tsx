import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PareamentoDoSensor, SensorPareado } from '@/aplicacao/portas/PareamentoDoSensor';
import { TEXTOS } from '@/textos';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { CORES } from '../tema/cores';
import { ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';
import { finalDoEndereco } from './textosDoSensor';

/** undefined: carregando. */
type EstadoDoCartao = SensorPareado | null | undefined;

/**
 * Sem sensor pareado, "Parear sensor" é a ação principal dos Ajustes; com um pareado, trocar vira secundário.
 * `aoSaberSeTemPareado` avisa a tela, para ela decidir o destaque dos outros cartões.
 */
export function CartaoDoSensorPareado({
  pareamento,
  aoSaberSeTemPareado,
}: {
  pareamento: PareamentoDoSensor;
  aoSaberSeTemPareado?: (temPareado: boolean) => void;
}) {
  const { container, recarregarJardim, recarregarJardins } = useAplicativo();
  const navegador = useRouter();
  const [pareado, definirPareado] = useState<EstadoDoCartao>(undefined);
  const [todos, definirTodos] = useState<readonly SensorPareado[]>([]);

  useFocusEffect(
    useCallback(() => {
      let atual = true;
      pareamento.obterPareado().then(
        (lido) => atual && definirPareado(lido),
        () => atual && definirPareado(null),
      );
      void pareamento.listarPareados?.().then((lista) => { if (atual) definirTodos(lista); });
      return () => {
        atual = false;
      };
    }, [pareamento]),
  );

  useEffect(() => {
    if (pareado !== undefined) aoSaberSeTemPareado?.(pareado !== null);
  }, [pareado, aoSaberSeTemPareado]);

  async function esquecer(sensor: SensorPareado) {
    for (const jardim of await container.gerenciarJardins.listar()) {
      if (jardim.idSensor === sensor.id) await container.gerenciarJardins.desassociar(jardim.id);
    }
    await pareamento.esquecer(sensor.id);
    const lista = pareamento.listarPareados ? await pareamento.listarPareados() : [];
    definirTodos(lista);
    definirPareado(lista[lista.length - 1] ?? null);
    await recarregarJardins();
    await recarregarJardim();
  }

  return (
    <View style={estilos.cartao}>
      <Text style={TEXTO.subtitulo} accessibilityRole="header">
        {TEXTOS.sensor.titulo}
      </Text>
      {pareado === undefined ? <Text style={TEXTO.corpo}>{TEXTOS.sensor.buscandoPareado}</Text> : null}
      {pareado === null ? (
        <Text style={TEXTO.corpo}>{TEXTOS.sensor.nenhumPareado}</Text>
      ) : null}
      {pareado && !pareamento.listarPareados ? (
        <View style={estilos.pareado} accessible accessibilityLabel={TEXTOS.sensor.pareadoCom(pareado.nome, finalDoEndereco(pareado.id))}>
          <View style={estilos.ponto} />
          <Text style={estilos.nome}>
            {TEXTOS.sensor.nomeComFinal(pareado.nome, finalDoEndereco(pareado.id))}
          </Text>
        </View>
      ) : null}
      {pareamento.listarPareados ? todos.map((sensor) => (
        <View key={sensor.id} style={estilos.pareado}>
          <Text style={estilos.nome}>{TEXTOS.sensor.nomeComFinal(sensor.nome, finalDoEndereco(sensor.id))}</Text>
          <BotaoPrincipal titulo={TEXTOS.sensor.esquecer(sensor.nome, finalDoEndereco(sensor.id))} variante="secundaria"
            aoTocar={() => void esquecer(sensor)} />
        </View>
      )) : null}
      {pareado !== undefined ? (
        <View style={estilos.botoes}>
          <BotaoPrincipal
            titulo={pareado ? TEXTOS.sensor.trocar : TEXTOS.sensor.parear}
            variante={pareado ? 'secundaria' : 'padrao'}
            aoTocar={() => navegador.push('/sensor')}
            largo
          />
          {pareado && !pareamento.listarPareados ? (
            <BotaoPrincipal titulo={TEXTOS.sensor.esquecerSensor} variante="secundaria" aoTocar={() => void esquecer(pareado)} largo />
          ) : null}
        </View>
      ) : null}
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
  pareado: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.pequeno },
  ponto: { width: 9, height: 9, borderRadius: RAIO.pilula, backgroundColor: CORES.statusOk },
  nome: { flex: 1, fontFamily: FONTES.forte, fontSize: 15, color: CORES.texto },
  botoes: { gap: ESPACO.pequeno },
});

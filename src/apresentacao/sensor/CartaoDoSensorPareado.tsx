import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PareamentoDoSensor, SensorPareado } from '@/aplicacao/portas/PareamentoDoSensor';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { CORES } from '../tema/cores';
import { ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';
import { finalDoEndereco } from './textosDoSensor';

/** undefined: carregando. */
type EstadoDoCartao = SensorPareado | null | undefined;

export function CartaoDoSensorPareado({ pareamento }: { pareamento: PareamentoDoSensor }) {
  const { recarregarJardim } = useAplicativo();
  const navegador = useRouter();
  const [pareado, definirPareado] = useState<EstadoDoCartao>(undefined);

  useFocusEffect(
    useCallback(() => {
      let atual = true;
      pareamento.obterPareado().then(
        (lido) => atual && definirPareado(lido),
        () => atual && definirPareado(null),
      );
      return () => {
        atual = false;
      };
    }, [pareamento]),
  );

  async function esquecer() {
    await pareamento.esquecer();
    definirPareado(null);
    await recarregarJardim();
  }

  return (
    <View style={estilos.cartao}>
      <Text style={TEXTO.subtitulo} accessibilityRole="header">
        Sensor do ambiente
      </Text>
      {pareado === undefined ? <Text style={TEXTO.corpo}>Buscando o sensor pareado…</Text> : null}
      {pareado === null ? (
        <Text style={TEXTO.corpo}>Nenhum sensor pareado. Pareie o FitoSfera para as leituras virem do ambiente real.</Text>
      ) : null}
      {pareado ? (
        <View style={estilos.pareado} accessible accessibilityLabel={`Pareado com ${pareado.nome}, final ${finalDoEndereco(pareado.id)}.`}>
          <View style={estilos.ponto} />
          <Text style={estilos.nome}>
            {pareado.nome} · final {finalDoEndereco(pareado.id)}
          </Text>
        </View>
      ) : null}
      {pareado !== undefined ? (
        <View style={estilos.botoes}>
          <BotaoPrincipal
            titulo={pareado ? 'Trocar sensor' : 'Parear sensor'}
            aoTocar={() => navegador.push('/sensor')}
            largo
          />
          {pareado ? (
            <BotaoPrincipal titulo="Esquecer sensor" variante="secundaria" aoTocar={() => void esquecer()} largo />
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

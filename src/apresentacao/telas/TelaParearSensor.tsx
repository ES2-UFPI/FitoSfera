import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FalhaNoPareamento,
  MotivoDaFalhaDoPareamento,
  PareamentoDoSensor,
  SensorEncontrado,
} from '@/aplicacao/portas/PareamentoDoSensor';
import { Leitura } from '@/dominio/modelos/Leitura';
import { TEXTOS } from '@/textos';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { BotaoVoltar } from '../componentes/BotaoVoltar';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { IndicadorDeConexao } from '../componentes/IndicadorDeConexao';
import { useConexaoDoSensor } from '../componentes/useConexaoDoSensor';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import {
  descreverSinal,
  finalDoEndereco,
  MENSAGEM_DA_FALHA,
  ordenarPorSinal,
  resumirLeitura,
} from '../sensor/textosDoSensor';
import { CORES } from '../tema/cores';
import { ALVO_DE_TOQUE, ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';
import { TelaEmBreve } from './TelaEmBreve';

export const DURACAO_DA_BUSCA_MS = 15_000;

/** Quando a solução está nas configurações do celular, o botão leva direto até lá. */
const ATALHO_DAS_CONFIGURACOES: Partial<
  Record<MotivoDaFalhaDoPareamento, { titulo: string; abrir: () => Promise<void> }>
> = {
  'permissao-negada': { titulo: TEXTOS.pareamento.abrirConfiguracoes, abrir: () => Linking.openSettings() },
  'bluetooth-desligado': {
    titulo: TEXTOS.pareamento.abrirConfiguracoesDoBluetooth,
    abrir: () =>
      Platform.OS === 'android' ? Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS') : Linking.openSettings(),
  },
};

type Etapa =
  | { readonly tipo: 'permissao' }
  | { readonly tipo: 'procurando'; readonly buscando: boolean }
  | { readonly tipo: 'conectando'; readonly sensor: SensorEncontrado }
  | { readonly tipo: 'pareado'; readonly leitura: Leitura }
  | { readonly tipo: 'falha'; readonly motivo: MotivoDaFalhaDoPareamento };

export function TelaParearSensor() {
  const { container } = useAplicativo();
  const pareamento = container.pareamentoDoSensor;
  if (pareamento === null) {
    return (
      <TelaEmBreve
        titulo={TEXTOS.pareamento.titulo}
        descricao={TEXTOS.pareamento.semBluetoothNestaVersao}
      />
    );
  }
  return <Pareamento pareamento={pareamento} />;
}

function Pareamento({ pareamento }: { pareamento: PareamentoDoSensor }) {
  const { recarregarJardim } = useAplicativo();
  const navegador = useRouter();
  const margens = useSafeAreaInsets();
  const conexao = useConexaoDoSensor();
  const [etapa, definirEtapa] = useState<Etapa>({ tipo: 'permissao' });
  const [encontrados, definirEncontrados] = useState<ReadonlyMap<string, SensorEncontrado>>(new Map());
  const pararBusca = useRef<(() => void) | null>(null);
  const limiteDaBusca = useRef<ReturnType<typeof setTimeout> | null>(null);

  const encerrarBusca = useCallback(() => {
    pararBusca.current?.();
    pararBusca.current = null;
    if (limiteDaBusca.current !== null) clearTimeout(limiteDaBusca.current);
    limiteDaBusca.current = null;
  }, []);

  const procurar = useCallback(() => {
    encerrarBusca();
    definirEncontrados(new Map());
    definirEtapa({ tipo: 'procurando', buscando: true });
    pararBusca.current = pareamento.procurar(
      (sensor) => definirEncontrados((anteriores) => new Map(anteriores).set(sensor.id, sensor)),
      (falha) => {
        encerrarBusca();
        definirEtapa({ tipo: 'falha', motivo: falha.motivo });
      },
    );
    limiteDaBusca.current = setTimeout(() => {
      encerrarBusca();
      definirEtapa((atual) => (atual.tipo === 'procurando' ? { tipo: 'procurando', buscando: false } : atual));
    }, DURACAO_DA_BUSCA_MS);
  }, [encerrarBusca, pareamento]);

  const comecar = useCallback(async () => {
    definirEtapa({ tipo: 'permissao' });
    const permitido = await pareamento.pedirPermissoes().catch(() => false);
    if (permitido) procurar();
    else definirEtapa({ tipo: 'falha', motivo: 'permissao-negada' });
  }, [pareamento, procurar]);

  useEffect(() => {
    void comecar();
    return encerrarBusca;
  }, [comecar, encerrarBusca]);

  async function escolher(sensor: SensorEncontrado) {
    encerrarBusca();
    definirEtapa({ tipo: 'conectando', sensor });
    try {
      const leitura = await pareamento.parear({ id: sensor.id, nome: sensor.nome });
      definirEtapa({ tipo: 'pareado', leitura });
      await recarregarJardim();
    } catch (falha) {
      definirEtapa({
        tipo: 'falha',
        motivo: falha instanceof FalhaNoPareamento ? falha.motivo : 'falha-na-conexao',
      });
    }
  }

  const atalho = etapa.tipo === 'falha' ? ATALHO_DAS_CONFIGURACOES[etapa.motivo] : undefined;

  return (
    <FundoAconchegante style={{ paddingTop: margens.top + ESPACO.pequeno }}>
      <View style={estilos.topo}>
        <BotaoVoltar />
      </View>
      <ScrollView
        contentContainerStyle={[estilos.conteudo, { paddingBottom: margens.bottom + ESPACO.folgado }]}
        scrollIndicatorInsets={{ bottom: margens.bottom }}
      >
        <Text style={TEXTO.titulo} accessibilityRole="header">
          {TEXTOS.pareamento.titulo}
        </Text>
        <Text style={TEXTO.corpo}>{TEXTOS.pareamento.explicacao}</Text>
        <IndicadorDeConexao conexao={conexao} />

        {etapa.tipo === 'permissao' ? (
          <Text style={TEXTO.corpo} accessibilityLiveRegion="polite">
            {TEXTOS.pareamento.pedindoPermissao}
          </Text>
        ) : null}

        {etapa.tipo === 'procurando' ? (
          <View style={estilos.secao}>
            {etapa.buscando ? (
              <View style={estilos.linha} accessible accessibilityLiveRegion="polite">
                <ActivityIndicator color={CORES.acao} />
                <Text style={TEXTO.corpo}>{TEXTOS.pareamento.procurando}</Text>
              </View>
            ) : null}
            {encontrados.size > 0 ? <Text style={TEXTO.apoio}>{TEXTOS.pareamento.comoDiferenciar}</Text> : null}
            {ordenarPorSinal(encontrados.values()).map((sensor) => (
              <Pressable
                key={sensor.id}
                accessibilityRole="button"
                accessibilityLabel={TEXTOS.pareamento.sensorNaLista(
                  sensor.nome,
                  finalDoEndereco(sensor.id),
                  descreverSinal(sensor.intensidadeDoSinal),
                )}
                onPress={() => void escolher(sensor)}
                style={({ pressed }) => [estilos.sensor, pressed && estilos.pressionado]}
              >
                <Text style={estilos.nome}>
                  {TEXTOS.pareamento.finalDoSensor(sensor.nome, finalDoEndereco(sensor.id))}
                </Text>
                <Text style={TEXTO.apoio}>{descreverSinal(sensor.intensidadeDoSinal)}</Text>
              </Pressable>
            ))}
            {!etapa.buscando && encontrados.size === 0 ? (
              <Text style={TEXTO.corpo}>{TEXTOS.pareamento.nenhumEncontrado}</Text>
            ) : null}
            {!etapa.buscando ? (
              // Achou sensores: escolher um deles é o principal. Não achou nenhum: procurar de novo passa a ser.
              <BotaoPrincipal
                titulo={TEXTOS.pareamento.procurarDeNovo}
                variante={encontrados.size === 0 ? 'padrao' : 'secundaria'}
                aoTocar={procurar}
                largo
              />
            ) : null}
          </View>
        ) : null}

        {etapa.tipo === 'conectando' ? (
          <View style={estilos.linha} accessible accessibilityLiveRegion="polite">
            <ActivityIndicator color={CORES.acao} />
            <Text style={[TEXTO.corpo, estilos.flexivel]}>
              {TEXTOS.pareamento.conectando(etapa.sensor.nome, finalDoEndereco(etapa.sensor.id))}
            </Text>
          </View>
        ) : null}

        {etapa.tipo === 'pareado' ? (
          <View style={estilos.secao} accessibilityLiveRegion="polite">
            <Text style={TEXTO.subtitulo}>{TEXTOS.pareamento.pareado}</Text>
            <Text style={TEXTO.corpo}>{TEXTOS.pareamento.primeiraLeitura(resumirLeitura(etapa.leitura))}</Text>
            <Text style={TEXTO.apoio}>{TEXTOS.pareamento.escolhaOJardim}</Text>
            <BotaoPrincipal titulo={TEXTOS.comum.concluir} aoTocar={() => navegador.back()} largo />
          </View>
        ) : null}

        {etapa.tipo === 'falha' ? (
          <View style={estilos.secao} accessible accessibilityRole="alert">
            <Text style={[TEXTO.subtitulo, estilos.erro]}>{MENSAGEM_DA_FALHA[etapa.motivo].titulo}</Text>
            <Text style={TEXTO.corpo}>{MENSAGEM_DA_FALHA[etapa.motivo].acao}</Text>
          </View>
        ) : null}
        {etapa.tipo === 'falha' ? (
          <View style={estilos.secao}>
            {atalho ? (
              <BotaoPrincipal
                titulo={atalho.titulo}
                variante="secundaria"
                aoTocar={() => void atalho.abrir().catch(() => undefined)}
                largo
              />
            ) : null}
            <BotaoPrincipal titulo={TEXTOS.comum.tentarDeNovo} aoTocar={() => void comecar()} largo />
          </View>
        ) : null}
      </ScrollView>
    </FundoAconchegante>
  );
}

const estilos = StyleSheet.create({
  topo: { paddingHorizontal: ESPACO.grande },
  conteudo: { paddingHorizontal: ESPACO.grande, paddingTop: ESPACO.grande, gap: ESPACO.grande },
  secao: { gap: ESPACO.medio },
  linha: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.medio },
  flexivel: { flex: 1 },
  sensor: {
    minHeight: ALVO_DE_TOQUE + ESPACO.grande,
    justifyContent: 'center',
    padding: ESPACO.medio,
    borderRadius: RAIO.medio,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    backgroundColor: CORES.superficie,
    gap: 2,
  },
  pressionado: { opacity: 0.78 },
  nome: { fontFamily: FONTES.forte, fontSize: 15, color: CORES.texto },
  erro: { color: CORES.erro },
});

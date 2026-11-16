import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PareamentoDoSensor, SensorPareado } from '@/aplicacao/portas/PareamentoDoSensor';
import { TEXTOS } from '@/textos';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { DialogoDeConfirmacao } from '../componentes/DialogoDeConfirmacao';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { CORES, ESPACO, FONTES, RAIO, TEXTO } from '../tema';
import { finalDoEndereco } from './textosDoSensor';
import { Cartao } from '../componentes/Cartao';

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
  const [paraEsquecer, definirParaEsquecer] = useState<SensorPareado | null>(null);
  const [esquecendo, definirEsquecendo] = useState(false);
  const [erroAoEsquecer, definirErroAoEsquecer] = useState(false);

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

  function pedirParaEsquecer(sensor: SensorPareado) {
    definirErroAoEsquecer(false);
    definirParaEsquecer(sensor);
  }

  async function confirmarEsquecer() {
    if (paraEsquecer === null || esquecendo) return;
    definirEsquecendo(true);
    try {
      await esquecer(paraEsquecer);
      definirParaEsquecer(null);
    } catch (falha) {
      console.warn('Não deu para esquecer o sensor.', falha);
      definirErroAoEsquecer(true);
    } finally {
      definirEsquecendo(false);
    }
  }

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
    <Cartao>
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
        // Nome em cima e botão embaixo: lado a lado, o botão espremia o nome em três linhas.
        <View key={sensor.id} style={estilos.pareadoDaLista}>
          <View style={estilos.pareado}>
            <View style={estilos.ponto} />
            <Text style={estilos.nome}>{TEXTOS.sensor.nomeComFinal(sensor.nome, finalDoEndereco(sensor.id))}</Text>
          </View>
          <BotaoPrincipal titulo={TEXTOS.sensor.esquecer(sensor.nome, finalDoEndereco(sensor.id))} variante="secundaria"
            aoTocar={() => pedirParaEsquecer(sensor)} largo />
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
            <BotaoPrincipal titulo={TEXTOS.sensor.esquecerSensor} variante="secundaria" aoTocar={() => pedirParaEsquecer(pareado)} largo />
          ) : null}
        </View>
      ) : null}
      <DialogoDeConfirmacao
        titulo={paraEsquecer ? TEXTOS.sensor.tituloDoEsquecer(paraEsquecer.nome, finalDoEndereco(paraEsquecer.id)) : ''}
        explicacao={TEXTOS.sensor.explicacaoDoEsquecer}
        tituloDoBotao={TEXTOS.sensor.confirmarEsquecer}
        tituloEmAndamento={TEXTOS.sensor.esquecendo}
        mensagemDeErro={TEXTOS.sensor.falhaAoEsquecer}
        visivel={paraEsquecer !== null}
        emAndamento={esquecendo}
        erro={erroAoEsquecer}
        aoConfirmar={() => void confirmarEsquecer()}
        aoCancelar={() => definirParaEsquecer(null)}
      />
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  pareado: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.pequeno },
  pareadoDaLista: { gap: ESPACO.pequeno },
  ponto: { width: 9, height: 9, borderRadius: RAIO.pilula, backgroundColor: CORES.statusOk },
  nome: { flex: 1, fontFamily: FONTES.forte, fontSize: 15, color: CORES.texto },
  botoes: { gap: ESPACO.pequeno },
});

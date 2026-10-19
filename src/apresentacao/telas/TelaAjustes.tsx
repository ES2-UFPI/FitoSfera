import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ConfiguracaoDoSensorDeDesenvolvimento,
  NivelDoSensorDeDesenvolvimento,
} from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { CORES } from '../tema/cores';
import { ALVO_DE_TOQUE, ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';
import { TelaEmBreve } from './TelaEmBreve';

type Grandeza = 'umidade' | 'temperatura' | 'luminosidade';

const AUTOMATICO: ConfiguracaoDoSensorDeDesenvolvimento = {
  umidade: 'automatico',
  temperatura: 'automatico',
  luminosidade: 'automatico',
  desconectado: false,
};

const QUENTE_SECO_ENSOLARADO: ConfiguracaoDoSensorDeDesenvolvimento = {
  umidade: 'baixo',
  temperatura: 'alto',
  luminosidade: 'alto',
  desconectado: false,
};

const GRUPOS: readonly { grandeza: Grandeza; titulo: string }[] = [
  { grandeza: 'umidade', titulo: 'Umidade' },
  { grandeza: 'temperatura', titulo: 'Temperatura' },
  { grandeza: 'luminosidade', titulo: 'Luz' },
];

const NIVEIS: readonly { nivel: NivelDoSensorDeDesenvolvimento; titulo: string }[] = [
  { nivel: 'automatico', titulo: 'Automático' },
  { nivel: 'baixo', titulo: 'Baixo' },
  { nivel: 'alto', titulo: 'Alto' },
];

function configuracoesIguais(
  primeira: ConfiguracaoDoSensorDeDesenvolvimento,
  segunda: ConfiguracaoDoSensorDeDesenvolvimento,
): boolean {
  return (
    primeira.umidade === segunda.umidade &&
    primeira.temperatura === segunda.temperatura &&
    primeira.luminosidade === segunda.luminosidade &&
    primeira.desconectado === segunda.desconectado
  );
}

function descrever(configuracao: ConfiguracaoDoSensorDeDesenvolvimento): string {
  if (configuracao.desconectado) return 'Combinação atual: sensor desconectado, sem novas leituras.';
  const nome = (nivel: NivelDoSensorDeDesenvolvimento) =>
    nivel === 'automatico' ? 'automática' : nivel === 'baixo' ? 'baixa' : 'alta';
  return `Combinação atual: umidade ${nome(configuracao.umidade)}, temperatura ${nome(configuracao.temperatura)} e luz ${nome(configuracao.luminosidade)}.`;
}

function configuracaoPersonalizada(configuracao: ConfiguracaoDoSensorDeDesenvolvimento): boolean {
  return (
    !configuracao.desconectado &&
    !configuracoesIguais(configuracao, AUTOMATICO) &&
    !configuracoesIguais(configuracao, QUENTE_SECO_ENSOLARADO)
  );
}

export function TelaAjustes() {
  const { container } = useAplicativo();
  const controle = container.controleDoSensorDeDesenvolvimento;
  const margens = useSafeAreaInsets();
  const [configuracao, definirConfiguracao] = useState<ConfiguracaoDoSensorDeDesenvolvimento>(
    () => controle?.obterConfiguracao() ?? AUTOMATICO,
  );

  if (controle === null) {
    return <TelaEmBreve titulo="Ajustes" descricao="Aqui você vai escolher o horário dos lembretes e o sensor." />;
  }

  const controleAtivo = controle;

  function aplicar(novaConfiguracao: ConfiguracaoDoSensorDeDesenvolvimento) {
    controleAtivo.definirConfiguracao(novaConfiguracao);
    definirConfiguracao(novaConfiguracao);
  }

  function definirNivel(grandeza: Grandeza, nivel: NivelDoSensorDeDesenvolvimento) {
    aplicar({ ...configuracao, [grandeza]: nivel, desconectado: false });
  }

  return (
    <FundoAconchegante>
      <ScrollView
        contentContainerStyle={[estilos.conteudo, { paddingTop: margens.top + ESPACO.medio }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={TEXTO.titulo} accessibilityRole="header">
          Ajustes
        </Text>
        <View style={estilos.cartao}>
          <View style={estilos.cabecalho}>
            <Text style={TEXTO.subtitulo}>Sensor de desenvolvimento</Text>
            <Text style={estilos.selo}>DADOS SIMULADOS</Text>
          </View>
          <Text style={TEXTO.corpo}>Use um atalho ou combine as condições para testar o aplicativo sem hardware.</Text>
          <View style={estilos.explicacaoDoAutomatico}>
            <Text style={estilos.tituloDaExplicacao}>O que significa automático?</Text>
            <Text style={TEXTO.apoio}>
              A condição varia sozinha ao longo do dia seguindo um ciclo ambiental simulado. Você pode deixar uma
              grandeza automática e forçar apenas as outras.
            </Text>
          </View>

          <Text style={TEXTO.rotulo}>ATALHOS</Text>
          <View style={estilos.opcoes}>
            <BotaoDeOpcao
              titulo="Tudo automático"
              selecionado={configuracoesIguais(configuracao, AUTOMATICO)}
              aoTocar={() => aplicar(AUTOMATICO)}
            />
            <BotaoDeOpcao
              titulo="Quente, seco e ensolarado"
              selecionado={configuracoesIguais(configuracao, QUENTE_SECO_ENSOLARADO)}
              aoTocar={() => aplicar(QUENTE_SECO_ENSOLARADO)}
            />
            <BotaoDeOpcao
              titulo="Customizado"
              selecionado={configuracaoPersonalizada(configuracao)}
              desabilitado={!configuracaoPersonalizada(configuracao)}
              aoTocar={() => {}}
            />
            <BotaoDeOpcao
              titulo="Desconectado"
              selecionado={configuracao.desconectado}
              aoTocar={() => aplicar({ ...configuracao, desconectado: true })}
            />
          </View>

          <Text style={TEXTO.rotulo}>COMBINAÇÃO PERSONALIZADA</Text>
          {GRUPOS.map((grupo) => (
            <View key={grupo.grandeza} style={estilos.grupo}>
              <Text style={estilos.tituloDoGrupo}>{grupo.titulo}</Text>
              <View style={estilos.linhaDeNiveis}>
                {NIVEIS.map((opcao) => {
                  const selecionada = !configuracao.desconectado && configuracao[grupo.grandeza] === opcao.nivel;
                  return (
                    <Pressable
                      key={opcao.nivel}
                      accessibilityRole="button"
                      accessibilityLabel={`${grupo.titulo}: ${opcao.titulo}`}
                      accessibilityState={{ selected: selecionada }}
                      onPress={() => definirNivel(grupo.grandeza, opcao.nivel)}
                      style={({ pressed }) => [
                        estilos.nivel,
                        selecionada && estilos.opcaoSelecionada,
                        pressed && estilos.opcaoPressionada,
                      ]}
                    >
                      <Text style={[estilos.textoDoNivel, selecionada && estilos.textoDaOpcaoSelecionada]}>
                        {opcao.titulo}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          <Text style={estilos.descricao} accessibilityLiveRegion="polite">
            {descrever(configuracao)}
          </Text>
        </View>
      </ScrollView>
    </FundoAconchegante>
  );
}

function BotaoDeOpcao({
  titulo,
  selecionado,
  desabilitado = false,
  aoTocar,
}: {
  titulo: string;
  selecionado: boolean;
  desabilitado?: boolean;
  aoTocar(): void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado, disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
      style={({ pressed }) => [
        estilos.opcao,
        selecionado && estilos.opcaoSelecionada,
        desabilitado && estilos.opcaoDesabilitada,
        pressed && estilos.opcaoPressionada,
      ]}
    >
      <Text style={[estilos.textoDaOpcao, selecionado && estilos.textoDaOpcaoSelecionada]}>{titulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    flexGrow: 1,
    paddingHorizontal: ESPACO.amplo,
    paddingBottom: ESPACO.folgado + ALVO_DE_TOQUE,
    gap: ESPACO.amplo,
  },
  cartao: {
    padding: ESPACO.grande,
    gap: ESPACO.grande,
    borderRadius: RAIO.grande,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    backgroundColor: CORES.superficie,
  },
  explicacaoDoAutomatico: {
    padding: ESPACO.medio,
    gap: ESPACO.minimo,
    borderRadius: RAIO.medio,
    backgroundColor: CORES.fundoTopo,
  },
  tituloDaExplicacao: { fontFamily: FONTES.forte, fontSize: 13, color: CORES.texto },
  cabecalho: { gap: ESPACO.pequeno },
  selo: {
    alignSelf: 'flex-start',
    paddingHorizontal: ESPACO.pequeno,
    paddingVertical: ESPACO.minimo,
    borderRadius: RAIO.pilula,
    backgroundColor: CORES.bolinhaDePasso,
    color: CORES.rotulo,
    fontFamily: FONTES.forte,
    fontSize: 10,
    letterSpacing: 1,
  },
  opcoes: { gap: ESPACO.pequeno },
  opcao: {
    minHeight: ALVO_DE_TOQUE,
    justifyContent: 'center',
    paddingHorizontal: ESPACO.grande,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.medio,
    backgroundColor: CORES.fundoTopo,
  },
  opcaoSelecionada: { borderColor: CORES.acao, backgroundColor: CORES.acao },
  opcaoDesabilitada: { opacity: 0.55 },
  opcaoPressionada: { opacity: 0.8 },
  textoDaOpcao: { fontFamily: FONTES.forte, fontSize: 14, color: CORES.texto },
  textoDaOpcaoSelecionada: { color: CORES.textoDaAcao },
  grupo: { gap: ESPACO.pequeno },
  tituloDoGrupo: { fontFamily: FONTES.forte, fontSize: 14, color: CORES.texto },
  linhaDeNiveis: { flexDirection: 'row', gap: ESPACO.pequeno },
  nivel: {
    flex: 1,
    minHeight: ALVO_DE_TOQUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ESPACO.minimo,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.medio,
    backgroundColor: CORES.fundoTopo,
  },
  textoDoNivel: { fontFamily: FONTES.forte, fontSize: 12, color: CORES.texto },
  descricao: { ...TEXTO.corpo, color: CORES.texto },
});

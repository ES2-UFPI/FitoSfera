import { ComponentType, useState } from 'react';
import { ColorValue, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ConfiguracaoDoSensorDeDesenvolvimento,
  NivelDoSensorDeDesenvolvimento,
} from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { IconeLuz, IconeTemperatura, IconeUmidade } from '../componentes/IconesDasCondicoes';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { CORES } from '../tema/cores';
import { ALVO_DE_TOQUE, ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';
import { TelaEmBreve } from './TelaEmBreve';

type Grandeza = 'umidade' | 'temperatura' | 'luminosidade';
type IconeDaGrandeza = ComponentType<{
  readonly cor: ColorValue;
  readonly tamanho?: number;
  readonly testID?: string;
}>;

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

const GRUPOS: readonly {
  grandeza: Grandeza;
  titulo: string;
  detalhe: string;
  Icone: IconeDaGrandeza;
  cor: ColorValue;
}[] = [
  { grandeza: 'umidade', titulo: 'Umidade', detalhe: 'Umidade relativa do ar', Icone: IconeUmidade, cor: CORES.acaoRega },
  {
    grandeza: 'temperatura',
    titulo: 'Temperatura',
    detalhe: 'Temperatura do ambiente',
    Icone: IconeTemperatura,
    cor: CORES.erro,
  },
  { grandeza: 'luminosidade', titulo: 'Luz', detalhe: 'Luminosidade do ambiente', Icone: IconeLuz, cor: CORES.statusAtencao },
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

function nomeDoNivel(nivel: NivelDoSensorDeDesenvolvimento): string {
  return nivel === 'automatico' ? 'Automático' : nivel === 'baixo' ? 'Baixo' : 'Alto';
}

function descrever(configuracao: ConfiguracaoDoSensorDeDesenvolvimento): string {
  if (configuracao.desconectado) return 'Sensor desativado: nenhuma leitura simulada será enviada.';
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
  const [menuAberto, definirMenuAberto] = useState<Grandeza | null>(null);

  if (controle === null) {
    return <TelaEmBreve titulo="Ajustes" descricao="Aqui você vai escolher o horário dos lembretes e o sensor." />;
  }

  const controleAtivo = controle;
  const sensorLigado = !configuracao.desconectado;

  function aplicar(novaConfiguracao: ConfiguracaoDoSensorDeDesenvolvimento) {
    controleAtivo.definirConfiguracao(novaConfiguracao);
    definirConfiguracao(novaConfiguracao);
    // O caso de uso concentra permissão, comparação, texto e deduplicação. A tela apenas pede uma nova
    // avaliação para o cenário de desenvolvimento produzir o aviso correspondente na hora.
    if (!novaConfiguracao.desconectado) void container.avaliarLeitura.executar();
  }

  function alternarSensor(ligado: boolean) {
    if (!ligado) definirMenuAberto(null);
    aplicar({ ...configuracao, desconectado: !ligado });
  }

  function definirNivel(grandeza: Grandeza, nivel: NivelDoSensorDeDesenvolvimento) {
    aplicar({ ...configuracao, [grandeza]: nivel, desconectado: false });
    definirMenuAberto(null);
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
            <View style={estilos.titulosDoCabecalho}>
              <Text style={TEXTO.subtitulo}>Sensor de desenvolvimento</Text>
              <Text style={estilos.selo}>DADOS SIMULADOS</Text>
            </View>
            <Switch
              accessibilityLabel="Sensor simulado"
              accessibilityHint="Ativa ou interrompe as leituras simuladas"
              accessibilityRole="switch"
              value={sensorLigado}
              onValueChange={alternarSensor}
              trackColor={{ false: CORES.bordaSuave, true: CORES.acao }}
              thumbColor={CORES.superficie}
            />
          </View>

          <View style={estilos.estadoDoSensor}>
            <View style={[estilos.indicadorDoSensor, sensorLigado && estilos.indicadorDoSensorAtivo]} />
            <Text style={estilos.textoDoEstado}>{sensorLigado ? 'Sensor simulado ativo' : 'Sensor simulado desativado'}</Text>
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
              desabilitado={!sensorLigado}
              aoTocar={() => aplicar(AUTOMATICO)}
            />
            <BotaoDeOpcao
              titulo="Quente, seco e ensolarado"
              selecionado={configuracoesIguais(configuracao, QUENTE_SECO_ENSOLARADO)}
              desabilitado={!sensorLigado}
              aoTocar={() => aplicar(QUENTE_SECO_ENSOLARADO)}
            />
            <BotaoDeOpcao
              titulo="Customizado"
              selecionado={configuracaoPersonalizada(configuracao)}
              desabilitado={!configuracaoPersonalizada(configuracao)}
              aoTocar={() => {}}
            />
          </View>

          <Text style={TEXTO.rotulo}>COMBINAÇÃO PERSONALIZADA</Text>
          <View style={estilos.menus}>
            {GRUPOS.map((grupo) => (
              <MenuDaGrandeza
                key={grupo.grandeza}
                {...grupo}
                nivel={configuracao[grupo.grandeza]}
                aberto={menuAberto === grupo.grandeza}
                desabilitado={!sensorLigado}
                aoAlternar={() => definirMenuAberto(menuAberto === grupo.grandeza ? null : grupo.grandeza)}
                aoSelecionar={(nivel) => definirNivel(grupo.grandeza, nivel)}
              />
            ))}
          </View>

          <Text style={estilos.descricao} accessibilityLiveRegion="polite">
            {descrever(configuracao)}
          </Text>
        </View>
      </ScrollView>
    </FundoAconchegante>
  );
}

function MenuDaGrandeza({
  grandeza,
  titulo,
  detalhe,
  Icone,
  cor,
  nivel,
  aberto,
  desabilitado,
  aoAlternar,
  aoSelecionar,
}: {
  grandeza: Grandeza;
  titulo: string;
  detalhe: string;
  Icone: IconeDaGrandeza;
  cor: ColorValue;
  nivel: NivelDoSensorDeDesenvolvimento;
  aberto: boolean;
  desabilitado: boolean;
  aoAlternar(): void;
  aoSelecionar(nivel: NivelDoSensorDeDesenvolvimento): void;
}) {
  return (
    <View style={[estilos.menu, desabilitado && estilos.menuDesabilitado]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Configurar ${titulo.toLocaleLowerCase('pt-BR')}`}
        accessibilityHint={`${nomeDoNivel(nivel)} selecionado`}
        accessibilityState={{ expanded: aberto, disabled: desabilitado }}
        disabled={desabilitado}
        onPress={aoAlternar}
        style={({ pressed }) => [estilos.cabecalhoDoMenu, pressed && estilos.opcaoPressionada]}
      >
        <View style={[estilos.caixaDoIcone, { borderColor: cor }]}>
          <Icone cor={cor} tamanho={30} testID={`icone-menu-${grandeza}`} />
        </View>
        <View style={estilos.textosDoMenu}>
          <Text style={estilos.tituloDoMenu}>{titulo}</Text>
          <Text style={estilos.detalheDoMenu}>{detalhe}</Text>
        </View>
        <View style={estilos.valorDoMenu}>
          <Text style={estilos.textoDoValor}>{nomeDoNivel(nivel)}</Text>
          <Text style={estilos.setaDoMenu}>{aberto ? '⌃' : '⌄'}</Text>
        </View>
      </Pressable>

      {aberto && (
        <View style={estilos.niveisDoMenu}>
          {NIVEIS.map((opcao) => {
            const selecionada = nivel === opcao.nivel;
            return (
              <Pressable
                key={opcao.nivel}
                accessibilityRole="button"
                accessibilityLabel={`${titulo}: ${opcao.titulo}`}
                accessibilityState={{ selected: selecionada }}
                onPress={() => aoSelecionar(opcao.nivel)}
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
      )}
    </View>
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
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    flexGrow: 1,
    paddingHorizontal: ESPACO.grande,
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
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ESPACO.medio },
  titulosDoCabecalho: { flex: 1, gap: ESPACO.pequeno },
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
  estadoDoSensor: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.pequeno },
  indicadorDoSensor: { width: 9, height: 9, borderRadius: RAIO.pilula, backgroundColor: CORES.statusSemDados },
  indicadorDoSensorAtivo: { backgroundColor: CORES.statusOk },
  textoDoEstado: { ...TEXTO.apoio, fontFamily: FONTES.forte },
  explicacaoDoAutomatico: {
    padding: ESPACO.medio,
    gap: ESPACO.minimo,
    borderRadius: RAIO.medio,
    backgroundColor: CORES.fundoTopo,
  },
  tituloDaExplicacao: { fontFamily: FONTES.forte, fontSize: 13, color: CORES.texto },
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
  opcaoDesabilitada: { opacity: 0.5 },
  opcaoPressionada: { opacity: 0.78 },
  textoDaOpcao: { fontFamily: FONTES.forte, fontSize: 14, color: CORES.texto },
  textoDaOpcaoSelecionada: { color: CORES.textoDaAcao },
  menus: { gap: ESPACO.medio },
  menu: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.medio,
    backgroundColor: CORES.fundoTopo,
  },
  menuDesabilitado: { opacity: 0.5 },
  cabecalhoDoMenu: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    padding: ESPACO.medio,
    gap: ESPACO.medio,
  },
  caixaDoIcone: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RAIO.medio,
    backgroundColor: CORES.superficie,
  },
  textosDoMenu: { flex: 1, gap: 2 },
  tituloDoMenu: { fontFamily: FONTES.forte, fontSize: 15, color: CORES.texto },
  detalheDoMenu: { ...TEXTO.apoio, fontSize: 11.5 },
  valorDoMenu: { alignItems: 'flex-end', gap: 1 },
  textoDoValor: { fontFamily: FONTES.forte, fontSize: 12, color: CORES.acao },
  setaDoMenu: { fontFamily: FONTES.forte, fontSize: 16, lineHeight: 18, color: CORES.textoApoio },
  niveisDoMenu: {
    flexDirection: 'row',
    padding: ESPACO.pequeno,
    paddingTop: 0,
    gap: ESPACO.pequeno,
  },
  nivel: {
    flex: 1,
    minHeight: ALVO_DE_TOQUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ESPACO.minimo,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.pequeno,
    backgroundColor: CORES.superficie,
  },
  textoDoNivel: { fontFamily: FONTES.forte, fontSize: 11.5, color: CORES.texto },
  descricao: { ...TEXTO.corpo, color: CORES.texto },
});

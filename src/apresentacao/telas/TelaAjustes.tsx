import { ComponentType, useState } from 'react';
import { ColorValue, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ConfiguracaoDoSensorDeDesenvolvimento,
  ControleDoSensorDeDesenvolvimento,
  NivelDoSensorDeDesenvolvimento,
} from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { TEXTOS } from '@/textos';
import { formatarData } from '../formatarData';
import { Cartao } from '../componentes/Cartao';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { IconeLuz, IconeTemperatura, IconeUmidade } from '../componentes/IconesDasCondicoes';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { ALVO_DE_TOQUE, CORES, ESPACO, FONTES, LARGURA_DO_CONTEUDO, RAIO, TEXTO } from '../tema';
import { CartaoDosLembretes } from '../lembretes/CartaoDosLembretes';
import { CartaoDoSensorPareado } from '../sensor/CartaoDoSensorPareado';

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
  {
    grandeza: 'umidade',
    titulo: TEXTOS.simulador.umidade,
    detalhe: TEXTOS.simulador.detalheDaUmidade,
    Icone: IconeUmidade,
    cor: CORES.acaoRega,
  },
  {
    grandeza: 'temperatura',
    titulo: TEXTOS.simulador.temperatura,
    detalhe: TEXTOS.simulador.detalheDaTemperatura,
    Icone: IconeTemperatura,
    cor: CORES.erro,
  },
  {
    grandeza: 'luminosidade',
    titulo: TEXTOS.simulador.luz,
    detalhe: TEXTOS.simulador.detalheDaLuz,
    Icone: IconeLuz,
    cor: CORES.statusAtencao,
  },
];

const NIVEIS: readonly { nivel: NivelDoSensorDeDesenvolvimento; titulo: string }[] = [
  { nivel: 'automatico', titulo: TEXTOS.simulador.automatico },
  { nivel: 'baixo', titulo: TEXTOS.simulador.baixo },
  { nivel: 'alto', titulo: TEXTOS.simulador.alto },
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
  return nivel === 'automatico' ? TEXTOS.simulador.automatico : nivel === 'baixo' ? TEXTOS.simulador.baixo : TEXTOS.simulador.alto;
}

function descrever(configuracao: ConfiguracaoDoSensorDeDesenvolvimento): string {
  if (configuracao.desconectado) return TEXTOS.simulador.desconectado;
  const nome = (nivel: NivelDoSensorDeDesenvolvimento) =>
    nivel === 'automatico' ? TEXTOS.simulador.automatica : nivel === 'baixo' ? TEXTOS.simulador.baixa : TEXTOS.simulador.alta;
  return TEXTOS.simulador.combinacao(
    nome(configuracao.umidade),
    nome(configuracao.temperatura),
    nome(configuracao.luminosidade),
  );
}

function configuracaoPersonalizada(configuracao: ConfiguracaoDoSensorDeDesenvolvimento): boolean {
  return (
    !configuracao.desconectado &&
    !configuracoesIguais(configuracao, AUTOMATICO) &&
    !configuracoesIguais(configuracao, QUENTE_SECO_ENSOLARADO)
  );
}

export function TelaAjustes() {
  const { container, idJardimSelecionado, jardins, recarregarJardins, recarregarJardim } = useAplicativo();
  const controle = container.controleDoSensorDeDesenvolvimento;
  const pareamento = container.pareamentoDoSensor;
  // Uma ação principal por tela: sem sensor pareado, parear é o mais urgente; senão, o horário dos lembretes.
  const [temPareado, definirTemPareado] = useState(true);
  const faltaParear = pareamento !== null && !temPareado;
  const margens = useSafeAreaInsets();
  const jardimAtual = jardins.find((jardim) => jardim.id === idJardimSelecionado);
  const simuladorAssociado = jardimAtual?.idSensor === 'simulado' || jardimAtual?.idSensor === `simulado:${idJardimSelecionado}`;

  async function alternarAssociacaoSimulada() {
    if (simuladorAssociado) await container.gerenciarJardins.desassociar(idJardimSelecionado);
    else await container.gerenciarJardins.associarSensorSimulado(idJardimSelecionado);
    await recarregarJardins();
    await recarregarJardim();
  }

  return (
    <FundoAconchegante>
      <ScrollView
        contentContainerStyle={[estilos.conteudo, { paddingTop: margens.top + ESPACO.medio }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={TEXTO.titulo} accessibilityRole="header">
          {TEXTOS.ajustes.titulo}
        </Text>
        <CartaoDosLembretes emDestaque={!faltaParear} />
        {pareamento ? <CartaoDoSensorPareado pareamento={pareamento} aoSaberSeTemPareado={definirTemPareado} /> : null}
        {controle ? (
          <CartaoDoSensorDeDesenvolvimento
            key={idJardimSelecionado}
            controle={controle}
            idJardim={idJardimSelecionado}
            nomeDoJardim={jardimAtual?.nome ?? TEXTOS.comum.jardimPrincipal}
            simuladorAssociado={simuladorAssociado}
            aoAlternarAssociacao={alternarAssociacaoSimulada}
            aoAtualizarLeituras={recarregarJardim}
          />
        ) : null}
      </ScrollView>
    </FundoAconchegante>
  );
}

function CartaoDoSensorDeDesenvolvimento({
  controle,
  idJardim,
  nomeDoJardim,
  simuladorAssociado,
  aoAlternarAssociacao,
  aoAtualizarLeituras,
}: {
  controle: ControleDoSensorDeDesenvolvimento;
  idJardim: string;
  nomeDoJardim: string;
  simuladorAssociado: boolean;
  aoAlternarAssociacao(): Promise<void>;
  aoAtualizarLeituras(): Promise<void>;
}) {
  const { container } = useAplicativo();
  const [configuracao, definirConfiguracao] = useState<ConfiguracaoDoSensorDeDesenvolvimento>(() =>
    controle.obterConfiguracao(idJardim),
  );
  const [menuAberto, definirMenuAberto] = useState<Grandeza | null>(null);
  const [falhaAoAssociar, definirFalhaAoAssociar] = useState(false);
  const [horarioSimulado, definirHorarioSimulado] = useState(() => controle.obterHorarioSimulado(idJardim));

  const controleAtivo = controle;
  const sensorLigado = !configuracao.desconectado;

  function aplicar(novaConfiguracao: ConfiguracaoDoSensorDeDesenvolvimento) {
    controleAtivo.definirConfiguracao(novaConfiguracao, idJardim);
    definirConfiguracao(novaConfiguracao);
    // O caso de uso concentra permissão, comparação, texto e deduplicação. A tela apenas pede uma nova
    // avaliação para o cenário de desenvolvimento produzir o aviso correspondente na hora.
    if (!novaConfiguracao.desconectado) void container.avaliarLeitura.executar(idJardim);
  }

  function alternarSensor(ligado: boolean) {
    if (!ligado) definirMenuAberto(null);
    aplicar({ ...configuracao, desconectado: !ligado });
  }

  function definirNivel(grandeza: Grandeza, nivel: NivelDoSensorDeDesenvolvimento) {
    aplicar({ ...configuracao, [grandeza]: nivel, desconectado: false });
    definirMenuAberto(null);
  }

  function ajustarHorario(deltaMs: number) {
    definirHorarioSimulado(controleAtivo.ajustarHorarioSimulado(deltaMs, idJardim));
    void aoAtualizarLeituras();
  }

  function voltarAoHorarioAtual() {
    definirHorarioSimulado(controleAtivo.redefinirHorarioSimulado(idJardim));
    void aoAtualizarLeituras();
  }

  return (
    <Cartao>
      <View style={estilos.cabecalho}>
        <View style={estilos.titulosDoCabecalho}>
          <Text style={TEXTO.subtitulo}>{TEXTOS.simulador.titulo(nomeDoJardim)}</Text>
          <Text style={estilos.selo}>{TEXTOS.simulador.selo}</Text>
        </View>
        <Switch
          accessibilityLabel={TEXTOS.simulador.interruptor}
          accessibilityHint={TEXTOS.simulador.dicaDoInterruptor}
          accessibilityRole="switch"
          value={sensorLigado}
          onValueChange={alternarSensor}
          trackColor={{ false: CORES.bordaSuave, true: CORES.acao }}
          thumbColor={CORES.superficie}
        />
      </View>

      <View style={estilos.vinculoDoJardim}>
        <View style={estilos.titulosDoCabecalho}>
          <Text style={estilos.tituloDaExplicacao}>{TEXTOS.simulador.jardimMonitorado}</Text>
          <Text style={TEXTO.apoio}>{simuladorAssociado ? TEXTOS.simulador.associadoA(nomeDoJardim) : TEXTOS.simulador.naoAssociadoA(nomeDoJardim)}</Text>
        </View>
        <BotaoPrincipal
          titulo={simuladorAssociado ? TEXTOS.simulador.pararDeUsar : TEXTOS.simulador.usarNesteJardim}
          variante="secundaria"
          largo
          aoTocar={() => {
            definirFalhaAoAssociar(false);
            void aoAlternarAssociacao().catch(() => definirFalhaAoAssociar(true));
          }}
        />
        {falhaAoAssociar ? (
          <Text style={estilos.erroDoVinculo} accessibilityRole="alert">{TEXTOS.simulador.falhaAoTrocar}</Text>
        ) : null}
      </View>

      <View style={estilos.estadoDoSensor}>
        <View style={[estilos.indicadorDoSensor, sensorLigado && estilos.indicadorDoSensorAtivo]} />
        <Text style={estilos.textoDoEstado}>{sensorLigado ? TEXTOS.simulador.ativo : TEXTOS.simulador.desligado}</Text>
      </View>

      <Text style={TEXTO.corpo}>{TEXTOS.simulador.explicacao}</Text>
      <View style={estilos.relogioSimulado}>
        <Text style={estilos.tituloDaExplicacao}>{TEXTOS.simulador.relogio}</Text>
        <Text style={estilos.horarioSimulado} accessibilityLiveRegion="polite">
          {formatarData(horarioSimulado, { comHora: true }) ?? TEXTOS.historico.dataDesconhecida}
        </Text>
        <Text style={TEXTO.apoio}>{TEXTOS.simulador.explicacaoDoRelogio}</Text>
        <View style={estilos.opcoesDeTempo}>
          <BotaoDeOpcao titulo={TEXTOS.simulador.menosUmaHora} aoTocar={() => ajustarHorario(-3_600_000)} />
          <BotaoDeOpcao titulo={TEXTOS.simulador.maisUmaHora} aoTocar={() => ajustarHorario(3_600_000)} />
          <BotaoDeOpcao titulo={TEXTOS.simulador.menosUmDia} aoTocar={() => ajustarHorario(-86_400_000)} />
          <BotaoDeOpcao titulo={TEXTOS.simulador.maisUmDia} aoTocar={() => ajustarHorario(86_400_000)} />
        </View>
        <BotaoPrincipal titulo={TEXTOS.simulador.voltarAoHorarioAtual} variante="secundaria" aoTocar={voltarAoHorarioAtual} />
      </View>
      <View style={estilos.explicacaoDoAutomatico}>
        <Text style={estilos.tituloDaExplicacao}>{TEXTOS.simulador.oQueEAutomatico}</Text>
        <Text style={TEXTO.apoio}>
          {TEXTOS.simulador.explicacaoDoAutomatico}
        </Text>
      </View>

      <Text style={TEXTO.rotulo}>{TEXTOS.simulador.rotuloDosAtalhos}</Text>
      <View style={estilos.opcoes}>
        <BotaoDeOpcao
          titulo={TEXTOS.simulador.tudoAutomatico}
          selecionado={configuracoesIguais(configuracao, AUTOMATICO)}
          desabilitado={!sensorLigado}
          aoTocar={() => aplicar(AUTOMATICO)}
        />
        <BotaoDeOpcao
          titulo={TEXTOS.simulador.quenteSecoEnsolarado}
          selecionado={configuracoesIguais(configuracao, QUENTE_SECO_ENSOLARADO)}
          desabilitado={!sensorLigado}
          aoTocar={() => aplicar(QUENTE_SECO_ENSOLARADO)}
        />
        <BotaoDeOpcao
          titulo={TEXTOS.simulador.personalizado}
          selecionado={configuracaoPersonalizada(configuracao)}
          desabilitado={!configuracaoPersonalizada(configuracao)}
          aoTocar={() => {}}
        />
      </View>

      <Text style={TEXTO.rotulo}>{TEXTOS.simulador.rotuloDaCombinacao}</Text>
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
    </Cartao>
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
        accessibilityLabel={TEXTOS.simulador.configurar(titulo.toLocaleLowerCase('pt-BR'))}
        accessibilityHint={TEXTOS.simulador.selecionado(nomeDoNivel(nivel))}
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
                accessibilityLabel={TEXTOS.simulador.nivelDaMedida(titulo, opcao.titulo)}
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
  selecionado = false,
  desabilitado = false,
  aoTocar,
}: {
  titulo: string;
  selecionado?: boolean;
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
    maxWidth: LARGURA_DO_CONTEUDO,
    alignSelf: 'center',
    flexGrow: 1,
    paddingHorizontal: ESPACO.grande,
    paddingBottom: ESPACO.folgado + ALVO_DE_TOQUE,
    gap: ESPACO.amplo,
  },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ESPACO.medio },
  titulosDoCabecalho: { flex: 1, gap: ESPACO.pequeno },
  vinculoDoJardim: {
    padding: ESPACO.medio,
    gap: ESPACO.pequeno,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.medio,
    backgroundColor: CORES.fundoTopo,
  },
  erroDoVinculo: { ...TEXTO.apoio, color: CORES.erro },
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
  relogioSimulado: {
    padding: ESPACO.medio,
    gap: ESPACO.pequeno,
    borderRadius: RAIO.medio,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    backgroundColor: CORES.superficie,
  },
  horarioSimulado: { fontFamily: FONTES.titulo, fontSize: 22, color: CORES.acao },
  opcoesDeTempo: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACO.pequeno },
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
  textosDoMenu: { flex: 1, gap: ESPACO.fino },
  tituloDoMenu: { fontFamily: FONTES.forte, fontSize: 15, color: CORES.texto },
  detalheDoMenu: { ...TEXTO.apoio, fontSize: 11.5 },
  valorDoMenu: { alignItems: 'flex-end', gap: ESPACO.fino },
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

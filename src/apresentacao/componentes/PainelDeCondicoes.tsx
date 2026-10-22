import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { compararMedicaoComFaixa, SituacaoDaMedicao } from '@/dominio/regras/AvaliacaoDaLeitura';
import { CORES_DA_LOGO, CORES_DOS_DESTAQUES } from '../ilustracao/paletas';
import { CORES } from '../tema/cores';
import { ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';
import { IconeLuz, IconeTemperatura, IconeUmidade } from './IconesDasCondicoes';


export interface LeituraDoPainel {
  readonly umidadePercentual: number;
  readonly temperaturaCelsius: number;
  readonly luminosidadeLux: number;
  readonly medidaEm: Date;
}

export interface FaixaDoPainel {
  readonly minimo: number;
  readonly maximo: number;
}

/** Referências opcionais: espécies sem uma delas continuam podendo aparecer no painel. */
export interface FaixasRecomendadasDoPainel {
  readonly umidadePercentual?: FaixaDoPainel;
  readonly temperaturaCelsius?: FaixaDoPainel;
  readonly luminosidadeLux?: FaixaDoPainel;
}

export type EstadoDoPainel =
  | { readonly tipo: 'carregando' }
  | { readonly tipo: 'indisponivel' }
  | { readonly tipo: 'sem-leitura'; readonly faixasRecomendadas?: FaixasRecomendadasDoPainel }
  | {
      readonly tipo: 'leitura';
      readonly leitura: LeituraDoPainel;
      readonly faixasRecomendadas?: FaixasRecomendadasDoPainel;
      readonly demonstracao?: boolean;
      readonly desatualizada?: boolean;
      readonly atualizando?: boolean;
    };

interface Props {
  readonly estado: EstadoDoPainel;
}

function formatarNumero(valor: number): string {
  return String(valor).replace('.', ',');
}

const APRESENTACAO_DA_SITUACAO: Record<SituacaoDaMedicao, { simbolo: string; texto: string; cor: string }> = {
  abaixo: { simbolo: '▼', texto: 'Abaixo do ideal', cor: CORES.statusAtencao },
  ideal: { simbolo: '✓', texto: 'Dentro do ideal', cor: CORES.statusOk },
  acima: { simbolo: '▲', texto: 'Acima do ideal', cor: CORES.statusAtencao },
};

export function formatarHorarioDaLeitura(instante: Date): string {
  const horas = String(instante.getHours()).padStart(2, '0');
  const minutos = String(instante.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

function Indicador({
  rotulo,
  valor,
  unidade,
  descricaoDaUnidade,
  icone,
  faixaRecomendada,
}: {
  rotulo: string;
  valor: number | null;
  unidade: string;
  descricaoDaUnidade: string;
  icone: ReactNode;
  faixaRecomendada?: FaixaDoPainel;
}) {
  const situacao = valor !== null && faixaRecomendada ? compararMedicaoComFaixa(valor, faixaRecomendada) : null;
  const apresentacao = situacao === null ? null : APRESENTACAO_DA_SITUACAO[situacao];
  const foraDoIdeal = situacao !== null && situacao !== 'ideal';
  const valorFormatado = valor === null ? null : formatarNumero(valor);
  const valorFalado = valorFormatado === null ? 'sem dados recentes' : `${valorFormatado} ${descricaoDaUnidade}`;
  const faixaVisivel = faixaRecomendada
    ? `${formatarNumero(faixaRecomendada.minimo)}–${formatarNumero(faixaRecomendada.maximo)}${unidade === '%' ? '' : ' '}${unidade}`
    : null;
  const descricaoDaFaixa = faixaRecomendada
    ? `Faixa ideal: ${formatarNumero(faixaRecomendada.minimo)} a ${formatarNumero(faixaRecomendada.maximo)} ${descricaoDaUnidade}.`
    : 'Faixa ideal não informada.';

  return (
    <View
      style={[estilos.indicador, foraDoIdeal && estilos.indicadorForaDoIdeal]}
      accessible
      accessibilityLabel={`${rotulo}: ${valorFalado}. ${descricaoDaFaixa}${
        apresentacao ? ` ${apresentacao.texto}.` : ''
      }`}
    >
      <View style={estilos.icone}>{icone}</View>
      <Text style={TEXTO.rotulo}>{rotulo.toUpperCase()}</Text>
      <View style={estilos.linhaDoValor}>
        {valorFormatado === null ? (
          <Text style={estilos.semDados}>sem dados</Text>
        ) : (
          <>
            <Text style={[estilos.valor, foraDoIdeal && estilos.valorForaDoIdeal]}>{valorFormatado}</Text>
            <Text style={estilos.unidade}>{unidade}</Text>
          </>
        )}
      </View>
      <Text style={estilos.faixa}>{faixaVisivel ? `Ideal: ${faixaVisivel}` : 'Faixa ideal não informada'}</Text>
      {apresentacao ? (
        <View style={[estilos.situacao, foraDoIdeal && { backgroundColor: apresentacao.cor }]}>
          <Text
            style={[estilos.textoDaSituacao, { color: foraDoIdeal ? CORES.superficie : apresentacao.cor }]}
          >
            {apresentacao.simbolo} {apresentacao.texto}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** A partir desta escala de fonte do sistema, três colunas não cabem lado a lado num celular. */
const FONTE_QUE_EMPILHA = 1.3;

function Indicadores({
  leitura,
  faixas,
}: {
  leitura: LeituraDoPainel | null;
  faixas?: FaixasRecomendadasDoPainel;
}) {
  const { fontScale } = useWindowDimensions();
  return (
    <View
      testID="indicadores-das-condicoes"
      style={[estilos.indicadores, fontScale >= FONTE_QUE_EMPILHA && estilos.indicadoresEmpilhados]}
    >
      <Indicador
        rotulo="Umidade"
        valor={leitura?.umidadePercentual ?? null}
        unidade="%"
        descricaoDaUnidade="por cento"
        icone={<IconeUmidade testID="icone-umidade" cor={CORES_DA_LOGO.gota} />}
        faixaRecomendada={faixas?.umidadePercentual}
      />
      <Indicador
        rotulo="Temperatura"
        valor={leitura?.temperaturaCelsius ?? null}
        unidade="°C"
        descricaoDaUnidade="graus Celsius"
        icone={<IconeTemperatura testID="icone-temperatura" cor={CORES_DOS_DESTAQUES.laranja.cor} />}
        faixaRecomendada={faixas?.temperaturaCelsius}
      />
      <Indicador
        rotulo="Luz"
        valor={leitura?.luminosidadeLux ?? null}
        unidade="lux"
        descricaoDaUnidade="lux"
        icone={<IconeLuz testID="icone-luz" cor={CORES_DA_LOGO.sol} />}
        faixaRecomendada={faixas?.luminosidadeLux}
      />
    </View>
  );
}

/** Painel puramente visual: recebe o estado pronto e não conhece sensores nem casos de uso. */
export function PainelDeCondicoes({ estado }: Props) {
  return (
    <View style={estilos.painel}>
      <View style={estilos.cabecalho}>
        <Text style={TEXTO.subtitulo} accessibilityRole="header">
          Condições agora
        </Text>
        {estado.tipo === 'leitura' && estado.demonstracao ? (
          <View style={estilos.seloDeDemonstracao}>
            <Text style={estilos.textoDoSelo}>DADOS DE DEMONSTRAÇÃO</Text>
          </View>
        ) : null}
      </View>

      {estado.tipo === 'carregando' ? (
        <Text style={[TEXTO.corpo, estilos.mensagem]} accessibilityLiveRegion="polite">
          Buscando as condições da planta…
        </Text>
      ) : null}

      {estado.tipo === 'indisponivel' ? (
        <Text style={[TEXTO.corpo, estilos.mensagem]} accessibilityLiveRegion="polite">
          O sensor ainda não está disponível nesta versão.
        </Text>
      ) : null}

      {estado.tipo === 'sem-leitura' ? (
        <>
          <Text style={[TEXTO.corpo, estilos.mensagem]} accessibilityLiveRegion="polite">
            Nenhuma leitura disponível ainda.
          </Text>
          {estado.faixasRecomendadas ? <Indicadores leitura={null} faixas={estado.faixasRecomendadas} /> : null}
        </>
      ) : null}

      {estado.tipo === 'leitura' ? (
        <>
          <Text style={estilos.horarioDaLeitura}>
            Última leitura às {formatarHorarioDaLeitura(estado.leitura.medidaEm)}
          </Text>
          {estado.atualizando ? (
            <View style={estilos.atualizando} accessible accessibilityLiveRegion="polite">
              <ActivityIndicator size="small" color={CORES.acao} />
              <Text style={TEXTO.apoio}>Atualizando condições…</Text>
            </View>
          ) : null}
          {estado.desatualizada ? (
            <View style={estilos.aviso} accessible accessibilityRole="alert">
              <Text style={estilos.simboloDoAviso}>!</Text>
              <Text style={estilos.textoDoAviso}>Leitura desatualizada</Text>
            </View>
          ) : null}
          {/* Leitura velha não passa por atual: os valores somem e só as faixas ideais ficam. */}
          <Indicadores
            leitura={estado.desatualizada ? null : estado.leitura}
            faixas={estado.faixasRecomendadas}
          />
        </>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  painel: {
    width: '100%',
    maxWidth: 520,
    padding: ESPACO.grande,
    borderRadius: RAIO.medio,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    backgroundColor: CORES.superficie,
    gap: ESPACO.medio,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: ESPACO.pequeno,
  },
  seloDeDemonstracao: {
    paddingVertical: ESPACO.minimo,
    paddingHorizontal: ESPACO.pequeno,
    borderRadius: RAIO.pilula,
    backgroundColor: CORES.papel,
  },
  textoDoSelo: {
    ...TEXTO.rotulo,
    fontSize: 9,
    color: CORES.textoDoPapel,
  },
  mensagem: {
    paddingVertical: ESPACO.pequeno,
  },
  horarioDaLeitura: {
    ...TEXTO.apoio,
    alignSelf: 'flex-start',
  },
  aviso: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACO.pequeno,
  },
  atualizando: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACO.pequeno,
  },
  simboloDoAviso: {
    minWidth: ESPACO.amplo,
    minHeight: ESPACO.amplo,
    borderRadius: RAIO.pilula,
    textAlign: 'center',
    fontFamily: FONTES.forte,
    color: CORES.superficie,
    backgroundColor: CORES.erro,
  },
  textoDoAviso: {
    ...TEXTO.apoio,
    color: CORES.erro,
  },
  indicadores: {
    flexDirection: 'row',
    gap: ESPACO.pequeno,
  },
  indicadoresEmpilhados: {
    flexDirection: 'column',
  },
  indicador: {
    flex: 1,
    minWidth: 0,
    paddingVertical: ESPACO.medio,
    paddingHorizontal: ESPACO.pequeno,
    alignItems: 'center',
    borderRadius: RAIO.pequeno,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: CORES.fundoTopo,
    gap: ESPACO.minimo,
  },
  indicadorForaDoIdeal: {
    borderWidth: 2.5,
    borderColor: CORES.statusAtencao,
    backgroundColor: CORES.fundoAtencao,
  },
  icone: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linhaDoValor: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: ESPACO.minimo,
  },
  valor: {
    fontFamily: FONTES.titulo,
    fontSize: 24,
    color: CORES.texto,
  },
  valorForaDoIdeal: {
    color: CORES.statusAtencao,
  },
  semDados: {
    fontFamily: FONTES.forte,
    fontSize: 13,
    color: CORES.textoApoio,
  },
  unidade: {
    fontFamily: FONTES.forte,
    fontSize: 11,
    color: CORES.textoApoio,
  },
  faixa: {
    ...TEXTO.apoio,
    minHeight: 34,
    textAlign: 'center',
    fontSize: 10.5,
  },
  situacao: {
    paddingVertical: 2,
    paddingHorizontal: ESPACO.pequeno,
    borderRadius: RAIO.pilula,
  },
  textoDaSituacao: {
    fontFamily: FONTES.forte,
    fontSize: 11,
    textAlign: 'center',
  },
});

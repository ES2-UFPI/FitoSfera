import { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CORES_DA_LOGO, CORES_DOS_DESTAQUES } from '../ilustracao/paletas';
import { CORES } from '../tema/cores';
import { ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';
import { IconeLuz, IconeTemperatura, IconeUmidade } from './IconesDasCondicoes';

/**
 * Valores já preparados para exibição. A futura `Leitura` do domínio poderá ser
 * convertida para este formato sem acoplar o painel à implementação do sensor.
 */
export interface LeituraDoPainel {
  readonly umidadePercentual: number;
  readonly temperaturaCelsius: number;
  readonly luminosidadeLux: number;
}

export type EstadoDoPainel =
  | { readonly tipo: 'carregando' }
  | { readonly tipo: 'indisponivel' }
  | { readonly tipo: 'sem-leitura' }
  | {
      readonly tipo: 'leitura';
      readonly leitura: LeituraDoPainel;
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

function Indicador({
  rotulo,
  valor,
  unidade,
  descricaoDaUnidade,
  icone,
}: {
  rotulo: string;
  valor: number;
  unidade: string;
  descricaoDaUnidade: string;
  icone: ReactNode;
}) {
  const valorFormatado = formatarNumero(valor);

  return (
    <View
      style={estilos.indicador}
      accessible
      accessibilityLabel={`${rotulo}: ${valorFormatado} ${descricaoDaUnidade}.`}
    >
      <View style={estilos.icone}>{icone}</View>
      <Text style={TEXTO.rotulo}>{rotulo.toUpperCase()}</Text>
      <View style={estilos.linhaDoValor}>
        <Text style={estilos.valor}>{valorFormatado}</Text>
        <Text style={estilos.unidade}>{unidade}</Text>
      </View>
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
        <Text style={[TEXTO.corpo, estilos.mensagem]} accessibilityLiveRegion="polite">
          Nenhuma leitura disponível ainda.
        </Text>
      ) : null}

      {estado.tipo === 'leitura' ? (
        <>
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
          <View style={estilos.indicadores}>
            <Indicador
              rotulo="Umidade"
              valor={estado.leitura.umidadePercentual}
              unidade="%"
              descricaoDaUnidade="por cento"
              icone={<IconeUmidade testID="icone-umidade" cor={CORES_DA_LOGO.gota} />}
            />
            <Indicador
              rotulo="Temperatura"
              valor={estado.leitura.temperaturaCelsius}
              unidade="°C"
              descricaoDaUnidade="graus Celsius"
              icone={<IconeTemperatura testID="icone-temperatura" cor={CORES_DOS_DESTAQUES.laranja.cor} />}
            />
            <Indicador
              rotulo="Luz"
              valor={estado.leitura.luminosidadeLux}
              unidade="lux"
              descricaoDaUnidade="lux"
              icone={<IconeLuz testID="icone-luz" cor={CORES_DA_LOGO.sol} />}
            />
          </View>
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
    width: ESPACO.amplo,
    height: ESPACO.amplo,
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
  indicador: {
    flex: 1,
    minWidth: 0,
    paddingVertical: ESPACO.medio,
    paddingHorizontal: ESPACO.pequeno,
    alignItems: 'center',
    borderRadius: RAIO.pequeno,
    backgroundColor: CORES.fundoTopo,
    gap: ESPACO.minimo,
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
  unidade: {
    fontFamily: FONTES.forte,
    fontSize: 11,
    color: CORES.textoApoio,
  },
});

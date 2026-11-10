import { StyleSheet, Text, View } from 'react-native';
import { ConexaoDoSensor, EstadoDaConexao } from '@/dominio/modelos/EstadoDaConexao';
import { TEXTOS } from '@/textos';
import { CORES } from '../tema/cores';
import { ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';
import { MENSAGEM_DO_PROBLEMA } from '../sensor/textosDoSensor';
import { formatarDataEHora } from './CartaoDoHistorico';

const APRESENTACAO: Record<EstadoDaConexao, { texto: string; cor: string }> = {
  conectado: { texto: TEXTOS.conexao.conectado, cor: CORES.statusOk },
  conectando: { texto: TEXTOS.conexao.conectando, cor: CORES.statusAtencao },
  desconectado: { texto: TEXTOS.conexao.desconectado, cor: CORES.erro },
  'sem-permissao': { texto: TEXTOS.conexao.semPermissao, cor: CORES.erro },
  indisponivel: { texto: TEXTOS.conexao.indisponivel, cor: CORES.statusSemDados },
};

function frase(texto: string): string {
  return /[.…]$/.test(texto) ? texto : `${texto}.`;
}

function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function descreverUltimaComunicacao(ultimaComunicacao: Date | null, agora: Date): string {
  if (ultimaComunicacao === null) return TEXTOS.conexao.semComunicacao;
  const horario = formatarDataEHora(ultimaComunicacao);
  const minutos = Math.max(0, Math.floor((agora.getTime() - ultimaComunicacao.getTime()) / 60_000));
  const decorrido = minutos < 1
    ? TEXTOS.conexao.haMenosDeUmMinuto
    : minutos < 60
      ? TEXTOS.conexao.haMinutos(minutos)
      : minutos < 1_440
        ? TEXTOS.conexao.haHoras(Math.floor(minutos / 60))
        : TEXTOS.conexao.haDias(Math.floor(minutos / 1_440));
  const quando = mesmoDia(ultimaComunicacao, agora)
    ? horario.slice(horario.indexOf('às'))
    : `em ${horario}`;
  return TEXTOS.conexao.ultimaComunicacao(decorrido, quando);
}

function horarioComSegundos(instante: Date): string {
  return [instante.getHours(), instante.getMinutes(), instante.getSeconds()]
    .map((parte) => String(parte).padStart(2, '0'))
    .join(':');
}

/** Com o Bluetooth desligado, o app espera a pessoa ligar: não há horário de tentativa a prometer. */
export function descreverReconexao(conexao: ConexaoDoSensor): string | null {
  if (conexao.estado !== 'desconectado' || conexao.problema === 'bluetooth-desligado') return null;
  return conexao.proximaTentativa
    ? TEXTOS.conexao.novaTentativa(horarioComSegundos(conexao.proximaTentativa))
    : TEXTOS.conexao.tentaSozinho;
}

function detalhes(conexao: ConexaoDoSensor, agora: Date): string[] {
  if (conexao.estado === 'sem-permissao') return [TEXTOS.conexao.permitaOBluetooth];
  if (conexao.estado !== 'desconectado') return [];
  return [
    conexao.problema ? MENSAGEM_DO_PROBLEMA[conexao.problema] : null,
    descreverReconexao(conexao),
    descreverUltimaComunicacao(conexao.ultimaComunicacao, agora),
  ].filter((linha): linha is string => linha !== null);
}

/** null enquanto a conexão ainda não foi informada: nada aparece, em vez de um estado inventado. */
export function IndicadorDeConexao({ conexao, agora = new Date() }: { conexao: ConexaoDoSensor | null; agora?: Date }) {
  if (conexao === null) return null;
  const { texto, cor } = APRESENTACAO[conexao.estado];
  const complementos = detalhes(conexao, agora);
  return (
    <View
      style={estilos.indicador}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={[texto, ...complementos].map(frase).join(' ')}
      testID="indicador-de-conexao"
    >
      <View style={[estilos.ponto, { backgroundColor: cor }]} />
      <View style={estilos.textos}>
        <Text style={estilos.texto}>{texto}</Text>
        {complementos.map((linha) => (
          <Text key={linha} style={TEXTO.apoio}>
            {frase(linha)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  indicador: { flexDirection: 'row', alignItems: 'flex-start', gap: ESPACO.pequeno },
  ponto: { width: 9, height: 9, marginTop: 5, borderRadius: RAIO.pilula },
  textos: { flex: 1 },
  texto: { fontFamily: FONTES.forte, fontSize: 13, color: CORES.texto },
});

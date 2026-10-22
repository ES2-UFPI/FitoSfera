import { StyleSheet, Text, View } from 'react-native';
import { ConexaoDoSensor, EstadoDaConexao } from '@/dominio/modelos/EstadoDaConexao';
import { CORES } from '../tema/cores';
import { ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';
import { formatarDataEHora } from './CartaoDoHistorico';

const APRESENTACAO: Record<EstadoDaConexao, { texto: string; cor: string }> = {
  conectado: { texto: 'Sensor conectado', cor: CORES.statusOk },
  conectando: { texto: 'Conectando ao sensor…', cor: CORES.statusAtencao },
  desconectado: { texto: 'Sensor desconectado', cor: CORES.erro },
  'sem-permissao': { texto: 'Sem permissão de Bluetooth', cor: CORES.erro },
  indisponivel: { texto: 'Nenhum sensor conectado', cor: CORES.statusSemDados },
};

function frase(texto: string): string {
  return /[.…]$/.test(texto) ? texto : `${texto}.`;
}

function mesmoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function descreverUltimaComunicacao(ultimaComunicacao: Date | null, agora: Date): string {
  if (ultimaComunicacao === null) return 'Sem comunicação desde que o app abriu';
  const horario = formatarDataEHora(ultimaComunicacao);
  return mesmoDia(ultimaComunicacao, agora)
    ? `Última comunicação ${horario.slice(horario.indexOf('às'))}`
    : `Última comunicação em ${horario}`;
}

function detalhe(conexao: ConexaoDoSensor, agora: Date): string | null {
  if (conexao.estado === 'desconectado') return descreverUltimaComunicacao(conexao.ultimaComunicacao, agora);
  if (conexao.estado === 'sem-permissao') return 'Permita o Bluetooth para o app voltar a receber leituras.';
  return null;
}

/** null enquanto a conexão ainda não foi informada: nada aparece, em vez de um estado inventado. */
export function IndicadorDeConexao({ conexao, agora = new Date() }: { conexao: ConexaoDoSensor | null; agora?: Date }) {
  if (conexao === null) return null;
  const { texto, cor } = APRESENTACAO[conexao.estado];
  const complemento = detalhe(conexao, agora);
  return (
    <View
      style={estilos.indicador}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={complemento ? `${frase(texto)} ${frase(complemento)}` : frase(texto)}
      testID="indicador-de-conexao"
    >
      <View style={[estilos.ponto, { backgroundColor: cor }]} />
      <View style={estilos.textos}>
        <Text style={estilos.texto}>{texto}</Text>
        {complemento ? <Text style={TEXTO.apoio}>{complemento}</Text> : null}
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

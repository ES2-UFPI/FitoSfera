import { EstimativaDeColheita } from '@/dominio/portas/EstimadorDeColheita';
import { EstagioDeDesenvolvimento } from '@/dominio/modelos/EspecieVegetal';
import { TEXTOS } from '@/textos';
import { StyleSheet, Text, View } from 'react-native';
import { CORES } from '../tema/cores';
import { ESPACO, RAIO } from '../tema/medidas';
import { TEXTO } from '../tema/tipografia';

/** Resumo visual da previsão e do estágio atual de uma espécie frutífera. */
export function BlocoDeColheita({
  estimativa,
  estagio,
  colheitaIniciada = false,
}: {
  estimativa: EstimativaDeColheita;
  estagio: EstagioDeDesenvolvimento | null;
  colheitaIniciada?: boolean;
}) {
  const prazo = estimativa.disponivel
      ? estimativa.diasRestantes === 0
        ? TEXTOS.detalhe.colheitaPrevistaParaHoje
        : TEXTOS.detalhe.faltamDiasParaColheita(estimativa.diasRestantes)
      : TEXTOS.detalhe.estimativaIndisponivel;

  return (
    <View style={estilos.cartao} testID="bloco-de-colheita">
      <Text style={TEXTO.subtitulo} accessibilityRole="header">
        {TEXTOS.detalhe.expectativaDeColheita}
      </Text>
      <Text style={estimativa.disponivel ? TEXTO.corpo : [TEXTO.corpo, estilos.indisponivel]}>{prazo}</Text>
      <Text style={TEXTO.apoio}>
        {estagio ? TEXTOS.detalhe.estagio(estagio.nome) : TEXTOS.detalhe.estagioIndisponivel}
      </Text>
      {colheitaIniciada && estimativa.disponivel ? (
        <Text style={TEXTO.apoio}>{TEXTOS.detalhe.estimativaDesdeFloracao}</Text>
      ) : null}
      {colheitaIniciada && !estimativa.disponivel && estimativa.motivo === 'sem-data-de-floracao' ? (
        <Text style={TEXTO.apoio}>{TEXTOS.detalhe.informeInicioDaFloracao}</Text>
      ) : null}
      {estimativa.disponivel && !estimativa.ajustada ? (
        <Text style={TEXTO.apoio}>
          {colheitaIniciada ? TEXTOS.detalhe.estimativaSemAjusteDaFloracao : TEXTOS.detalhe.estimativaSemAjusteAmbiental}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    width: '100%',
    maxWidth: 520,
    padding: ESPACO.grande,
    borderRadius: RAIO.medio,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    backgroundColor: CORES.superficie,
    gap: ESPACO.pequeno,
  },
  indisponivel: { color: CORES.textoApoio },
});

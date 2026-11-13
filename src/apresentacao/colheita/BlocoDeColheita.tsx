import { EstimativaDeColheita } from '@/dominio/portas/EstimadorDeColheita';
import { EstagioDeDesenvolvimento } from '@/dominio/modelos/EspecieVegetal';
import { TEXTOS } from '@/textos';
import { StyleSheet, Text } from 'react-native';
import { CORES, TEXTO } from '../tema';
import { Cartao } from '../componentes/Cartao';

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
    <Cartao testID="bloco-de-colheita">
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
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  indisponivel: { color: CORES.textoApoio },
});

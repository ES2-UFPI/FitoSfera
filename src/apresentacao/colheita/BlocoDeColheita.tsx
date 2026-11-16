import { EstimativaDeColheita } from '@/dominio/portas/EstimadorDeColheita';
import { EstagioDeDesenvolvimento } from '@/dominio/modelos/EspecieVegetal';
import { TEXTOS } from '@/textos';
import { StyleSheet, Text } from 'react-native';
import { CORES, TEXTO } from '../tema';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { Cartao } from '../componentes/Cartao';
import { formatarData } from '../formatarData';

/** Resumo visual da previsão e do estágio atual de uma espécie frutífera. */
export function BlocoDeColheita({
  estimativa,
  estagio,
  colheitaIniciada = false,
  ultimaColheitaEm = null,
  aoInformarFloracao,
}: {
  estimativa: EstimativaDeColheita;
  estagio: EstagioDeDesenvolvimento | null;
  colheitaIniciada?: boolean;
  /** A colheita registrada mais recente, se houver. */
  ultimaColheitaEm?: Date | null;
  /** Abre o lugar onde a pessoa informa o início da floração. */
  aoInformarFloracao?: () => void;
}) {
  // Já produzindo, sem a data da floração: não dá para prever a próxima leva, mas dá para dizer o que se sabe.
  const emColheitaSemFloracao =
    colheitaIniciada && !estimativa.disponivel && estimativa.motivo === 'sem-data-de-floracao';
  const prazo = estimativa.disponivel
    ? estimativa.diasRestantes === 0
      ? TEXTOS.detalhe.colheitaPrevistaParaHoje
      : TEXTOS.detalhe.faltamDiasParaColheita(estimativa.diasRestantes)
    : emColheitaSemFloracao
      ? TEXTOS.detalhe.emColheita
      : TEXTOS.detalhe.estimativaIndisponivel;
  const nomeDoEstagio = estagio?.nome ?? (emColheitaSemFloracao ? TEXTOS.detalhe.estagioDeColheita : null);
  const ultimaColheita = colheitaIniciada && ultimaColheitaEm !== null ? formatarData(ultimaColheitaEm) : null;

  return (
    <Cartao testID="bloco-de-colheita">
      <Text style={TEXTO.subtitulo} accessibilityRole="header">
        {TEXTOS.detalhe.expectativaDeColheita}
      </Text>
      <Text
        style={estimativa.disponivel || emColheitaSemFloracao ? TEXTO.corpo : [TEXTO.corpo, estilos.indisponivel]}
      >
        {prazo}
      </Text>
      {ultimaColheita !== null ? <Text style={TEXTO.apoio}>{TEXTOS.detalhe.ultimaColheitaEm(ultimaColheita)}</Text> : null}
      <Text style={TEXTO.apoio}>
        {nomeDoEstagio ? TEXTOS.detalhe.estagio(nomeDoEstagio) : TEXTOS.detalhe.estagioIndisponivel}
      </Text>
      {colheitaIniciada && estimativa.disponivel ? (
        <Text style={TEXTO.apoio}>{TEXTOS.detalhe.estimativaDesdeFloracao}</Text>
      ) : null}
      {emColheitaSemFloracao ? (
        <>
          <Text style={TEXTO.apoio}>{TEXTOS.detalhe.informeInicioDaFloracao}</Text>
          {aoInformarFloracao ? (
            <BotaoPrincipal
              titulo={TEXTOS.detalhe.informarInicioDaFloracao}
              variante="secundaria"
              aoTocar={aoInformarFloracao}
              largo
            />
          ) : null}
        </>
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

import { StyleSheet, Text, View } from 'react-native';
import { LuzDoDia } from '@/dominio/regras/LuzDoDia';
import { TEXTOS } from '@/textos';
import { CORES, ESPACO, FONTES, RAIO, TEXTO } from '../tema';
import { Cartao } from './Cartao';

/**
 * De quanto em quanto tempo a tela aberta recalcula a luz de hoje, mesmo sem leitura nova: é assim que o sensor
 * calado vira "dados incompletos" e que a meia-noite zera o dia sem a pessoa precisar sair da tela.
 */
export const INTERVALO_DA_LUZ_DE_HOJE_MS = 60_000;

/** Como o dia deve terminar, pela projeção; sem projeção (cedo demais), não arrisca. */
function fraseDoRitmo(luz: LuzDoDia): string {
  return luz.situacaoProjetada === null ? TEXTOS.luzDeHoje.cedoParaSaber : TEXTOS.luzDeHoje.ritmo[luz.situacaoProjetada];
}

/**
 * Quanto da luz de hoje a planta já recebeu. Com dados faltando, a porcentagem só aparece se a meta já foi
 * alcançada: abaixo dela, um número baixo pareceria falta de luz quando, na verdade, é falta de dados.
 */
export function CartaoDaLuzDeHoje({ luz }: { luz: LuzDoDia | undefined }) {
  if (luz === undefined || luz.progresso === null) return null;
  const porcento = Math.round(luz.progresso * 100);
  const semMedida = luz.conhecidaAte === null;
  const mostrarPorcentagem = !semMedida && (!luz.incompleta || luz.progresso >= 1);
  const frase = luz.incompleta ? TEXTOS.luzDeHoje.metaJaAlcancada : fraseDoRitmo(luz);

  return (
    <Cartao>
      <Text style={TEXTO.subtitulo} accessibilityRole="header">
        {TEXTOS.luzDeHoje.titulo}
      </Text>

      {mostrarPorcentagem ? (
        <View style={estilos.progresso} accessible accessibilityLabel={TEXTOS.luzDeHoje.falado(porcento, frase)}>
          <View style={estilos.linhaDoValor}>
            <Text style={estilos.valor}>{TEXTOS.luzDeHoje.porcentagem(porcento)}</Text>
            <Text style={estilos.legenda}>{TEXTOS.luzDeHoje.daLuzDeHoje}</Text>
          </View>
          <View style={estilos.trilho}>
            <View style={[estilos.preenchido, { width: `${Math.min(porcento, 100)}%` }]} />
          </View>
          <Text style={TEXTO.corpo}>{frase}</Text>
        </View>
      ) : null}

      {semMedida ? <Text style={TEXTO.corpo}>{TEXTOS.luzDeHoje.semMedida}</Text> : null}

      {luz.incompleta && !semMedida ? (
        <View style={estilos.aviso} accessible>
          <Text style={estilos.tituloDoAviso}>{TEXTOS.luzDeHoje.incompletos}</Text>
          {mostrarPorcentagem ? null : <Text style={estilos.textoDoAviso}>{TEXTOS.luzDeHoje.parteNaoContada}</Text>}
        </View>
      ) : null}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  progresso: { gap: ESPACO.pequeno },
  linhaDoValor: { flexDirection: 'row', alignItems: 'baseline', gap: ESPACO.pequeno },
  valor: { fontFamily: FONTES.titulo, fontSize: 34, lineHeight: 40, color: CORES.texto },
  legenda: { fontFamily: FONTES.forte, fontSize: 15, color: CORES.textoApoio },
  trilho: { height: 8, borderRadius: RAIO.pilula, backgroundColor: CORES.bolinhaDePasso, overflow: 'hidden' },
  preenchido: { height: '100%', borderRadius: RAIO.pilula, backgroundColor: CORES.luzDoSol },
  aviso: { gap: ESPACO.fino, padding: ESPACO.medio, borderRadius: RAIO.pequeno, backgroundColor: CORES.fundoAtencao },
  tituloDoAviso: { fontFamily: FONTES.forte, fontSize: 14, color: CORES.texto },
  textoDoAviso: { fontFamily: FONTES.texto, fontSize: 13.5, lineHeight: 19, color: CORES.texto },
});

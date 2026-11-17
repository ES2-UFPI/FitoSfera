import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ResultadoDaDemonstracao, SimularSolNaDemonstracao } from '@/aplicacao/casos-de-uso/SimularSolNaDemonstracao';
import { LUX_DO_SOL_FORTE } from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { TEXTOS } from '@/textos';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { Cartao } from '../componentes/Cartao';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { CORES, ESPACO, FONTES, TEXTO } from '../tema';

const MENSAGEM: Record<ResultadoDaDemonstracao, string> = {
  preenchido: TEXTOS.demonstracao.preenchido,
  'ja-preenchido': TEXTOS.demonstracao.jaPreenchido,
  'sem-leitura-hoje': TEXTOS.demonstracao.semLeituraHoje,
  'antes-das-7h': TEXTOS.demonstracao.antesDas7h,
};

/** Aparece nos Ajustes depois do código secreto: preenche a luz de hoje desde as 7h com o sensor de verdade. */
export function CartaoDaDemonstracao({
  simularSol,
  temSensorNoJardim,
}: {
  simularSol: SimularSolNaDemonstracao;
  temSensorNoJardim: boolean;
}) {
  const { idJardimSelecionado, recarregarJardim, desligarModoDeDemonstracao } = useAplicativo();
  const [estado, definirEstado] = useState<'ocioso' | 'preenchendo' | ResultadoDaDemonstracao | 'falha'>('ocioso');

  async function preencher() {
    definirEstado('preenchendo');
    try {
      const resultado = await simularSol.executar(idJardimSelecionado);
      definirEstado(resultado);
      if (resultado === 'preenchido') void recarregarJardim();
    } catch (falha) {
      console.warn('Não deu para preencher a luz da demonstração.', falha);
      definirEstado('falha');
    }
  }

  const mensagem =
    estado === 'ocioso' || estado === 'preenchendo'
      ? null
      : estado === 'falha'
        ? TEXTOS.demonstracao.falha
        : MENSAGEM[estado];

  return (
    <Cartao>
      <Text style={TEXTO.subtitulo} accessibilityRole="header">
        {TEXTOS.demonstracao.titulo}
      </Text>
      <Text style={TEXTO.apoio}>{TEXTOS.demonstracao.explicacao(LUX_DO_SOL_FORTE.toLocaleString('pt-BR'))}</Text>
      <BotaoPrincipal
        titulo={estado === 'preenchendo' ? TEXTOS.demonstracao.simulando : TEXTOS.demonstracao.simularSol}
        variante="secundaria"
        largo
        desabilitado={!temSensorNoJardim || estado === 'preenchendo'}
        aoTocar={() => void preencher()}
      />
      {!temSensorNoJardim ? <Text style={TEXTO.apoio}>{TEXTOS.demonstracao.semSensorNoJardim}</Text> : null}
      {mensagem !== null ? (
        <Text style={TEXTO.apoio} accessibilityLiveRegion="polite">
          {mensagem}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={desligarModoDeDemonstracao}
        hitSlop={ESPACO.pequeno}
        style={estilos.desligar}
      >
        <Text style={estilos.textoDoDesligar}>{TEXTOS.demonstracao.desligar}</Text>
      </Pressable>
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  desligar: { alignSelf: 'flex-start' },
  textoDoDesligar: { fontFamily: FONTES.forte, fontSize: 14, color: CORES.acao, textDecorationLine: 'underline' },
});

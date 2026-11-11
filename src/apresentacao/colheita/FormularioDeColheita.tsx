import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ColheitaInvalida, MotivoDaColheitaInvalida } from '@/aplicacao/casos-de-uso/RegistrarColheita';
import { RegistroDeColheita, UnidadeDeColheita, UNIDADES_DE_COLHEITA } from '@/dominio/modelos/RegistroDeColheita';
import { TEXTOS } from '@/textos';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { formatarData } from '../formatarData';
import { CORES } from '../tema/cores';
import { ALVO_DE_TOQUE, ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';
import { escreverDia, lerDia, lerQuantidade } from './entradaDaColheita';

type Estado =
  | { readonly tipo: 'ocioso' }
  | { readonly tipo: 'registrando' }
  | { readonly tipo: 'registrada'; readonly registro: RegistroDeColheita }
  | { readonly tipo: 'recusada'; readonly motivo: MotivoDaColheitaInvalida }
  | { readonly tipo: 'falhou' };

const TEXTO_DA_UNIDADE: Record<UnidadeDeColheita, string> = {
  unidades: TEXTOS.colheita.unidades,
  gramas: TEXTOS.colheita.gramas,
};

/** "12 frutos" ou "250,5 g", como a confirmação mostra. */
export function descreverQuantidade({ quantidade, unidade }: Pick<RegistroDeColheita, 'quantidade' | 'unidade'>) {
  return unidade === 'unidades'
    ? TEXTOS.colheita.frutos(quantidade)
    : TEXTOS.colheita.emGramas(String(quantidade).replace('.', ','));
}

/** Registro de uma colheita na tela da planta: quantidade, como foi medida e o dia, que já vem com hoje. */
export function FormularioDeColheita({ idPlanta }: { idPlanta: string }) {
  const { container } = useAplicativo();
  const registrar = container.registrarColheita;
  const [quantidade, definirQuantidade] = useState('');
  const [unidade, definirUnidade] = useState<UnidadeDeColheita>('unidades');
  const [dia, definirDia] = useState(() => escreverDia(registrar.hoje()));
  const [estado, definirEstado] = useState<Estado>({ tipo: 'ocioso' });
  // O estado só muda no próximo render; a ref barra o segundo toque que chega no mesmo instante.
  const registrandoAgora = useRef(false);

  async function enviar() {
    if (registrandoAgora.current) return;
    registrandoAgora.current = true;
    definirEstado({ tipo: 'registrando' });
    try {
      const registro = await registrar.executar({
        idPlanta,
        quantidade: lerQuantidade(quantidade),
        unidade,
        dia: lerDia(dia),
      });
      definirEstado({ tipo: 'registrada', registro });
      definirQuantidade('');
      definirDia(escreverDia(registrar.hoje()));
    } catch (falha) {
      if (falha instanceof ColheitaInvalida) definirEstado({ tipo: 'recusada', motivo: falha.motivo });
      else {
        console.warn('Não deu para registrar a colheita.', falha);
        definirEstado({ tipo: 'falhou' });
      }
    } finally {
      registrandoAgora.current = false;
    }
  }

  const recusa = estado.tipo === 'recusada' ? estado.motivo : null;
  const erroNaQuantidade =
    recusa === 'quantidade-vazia' || recusa === 'quantidade-invalida' || recusa === 'unidades-fracionadas';
  const erroNaData = recusa === 'data-invalida' || recusa === 'data-no-futuro';

  return (
    <View style={estilos.cartao}>
      <Text style={TEXTO.subtitulo} accessibilityRole="header">
        {TEXTOS.colheita.titulo}
      </Text>
      <Text style={TEXTO.apoio}>{TEXTOS.colheita.explicacao}</Text>

      <View style={estilos.campo}>
        <Text style={TEXTO.rotulo}>{TEXTOS.colheita.quantidade.toUpperCase()}</Text>
        <TextInput
          value={quantidade}
          onChangeText={definirQuantidade}
          accessibilityLabel={TEXTOS.colheita.quantidade}
          placeholder={TEXTOS.colheita.exemploDeQuantidade}
          placeholderTextColor={CORES.abaInativa}
          keyboardType="decimal-pad"
          returnKeyType="done"
          style={[estilos.entrada, erroNaQuantidade && estilos.entradaComErro]}
        />
      </View>

      <View style={estilos.campo}>
        <Text style={TEXTO.rotulo}>{TEXTOS.colheita.medida.toUpperCase()}</Text>
        <View style={estilos.opcoes} accessibilityRole="radiogroup">
          {UNIDADES_DE_COLHEITA.map((opcao) => {
            const escolhida = opcao === unidade;
            return (
              <Pressable
                key={opcao}
                accessibilityRole="radio"
                accessibilityState={{ checked: escolhida }}
                accessibilityLabel={TEXTO_DA_UNIDADE[opcao]}
                onPress={() => definirUnidade(opcao)}
                style={({ pressed }) => [
                  estilos.opcao,
                  escolhida && estilos.opcaoEscolhida,
                  pressed && estilos.pressionado,
                ]}
              >
                <Text style={[estilos.textoDaOpcao, escolhida && estilos.textoDaOpcaoEscolhida]}>
                  {TEXTO_DA_UNIDADE[opcao]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={estilos.campo}>
        <Text style={TEXTO.rotulo}>{TEXTOS.colheita.data.toUpperCase()}</Text>
        <TextInput
          value={dia}
          onChangeText={definirDia}
          accessibilityLabel={TEXTOS.colheita.data}
          accessibilityHint={TEXTOS.colheita.ajudaDaData}
          placeholder={TEXTOS.colheita.formatoDaData}
          placeholderTextColor={CORES.abaInativa}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          style={[estilos.entrada, erroNaData && estilos.entradaComErro]}
        />
        <Text style={TEXTO.apoio}>{TEXTOS.colheita.ajudaDaData}</Text>
      </View>

      <BotaoPrincipal
        titulo={estado.tipo === 'registrando' ? TEXTOS.colheita.registrando : TEXTOS.colheita.registrar}
        aoTocar={() => void enviar()}
        desabilitado={estado.tipo === 'registrando'}
        largo
      />

      {estado.tipo === 'registrada' ? (
        <Text style={[TEXTO.corpo, estilos.confirmacao]} accessibilityLiveRegion="polite">
          {TEXTOS.colheita.registrada(
            descreverQuantidade(estado.registro),
            formatarData(estado.registro.colhidaEm) ?? escreverDia(registrar.hoje()),
          )}
        </Text>
      ) : null}
      {recusa !== null ? (
        <Text style={[TEXTO.corpo, estilos.erro]} accessibilityRole="alert">
          {TEXTOS.colheita.recusas[recusa]}
        </Text>
      ) : null}
      {estado.tipo === 'falhou' ? (
        <Text style={[TEXTO.corpo, estilos.erro]} accessibilityRole="alert">
          {TEXTOS.colheita.falhaAoGravar}
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
    gap: ESPACO.medio,
  },
  campo: { gap: ESPACO.minimo },
  entrada: {
    minHeight: ALVO_DE_TOQUE,
    paddingHorizontal: ESPACO.medio,
    borderWidth: 1.5,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.medio,
    backgroundColor: CORES.fundoTopo,
    fontFamily: FONTES.forte,
    fontSize: 16,
    color: CORES.texto,
  },
  entradaComErro: { borderColor: CORES.erro },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACO.pequeno },
  opcao: {
    flexGrow: 1,
    flexBasis: 130,
    minHeight: ALVO_DE_TOQUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ESPACO.medio,
    borderWidth: 1.5,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.pilula,
    backgroundColor: CORES.fundoTopo,
  },
  opcaoEscolhida: { borderColor: CORES.acao, backgroundColor: CORES.papel },
  pressionado: { opacity: 0.72 },
  textoDaOpcao: { fontFamily: FONTES.forte, fontSize: 14, color: CORES.textoApoio },
  textoDaOpcaoEscolhida: { color: CORES.acao },
  confirmacao: { color: CORES.texto, textAlign: 'center' },
  erro: { color: CORES.erro, textAlign: 'center' },
});

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { RegaInvalida } from '@/aplicacao/casos-de-uso/RegistrarRega';
import { TEXTOS } from '@/textos';
import { mascararData } from '../mascaraDeData';
import { CORES, ESPACO, FONTES, RAIO, TEXTO } from '../tema';
import { BotaoPrincipal } from './BotaoPrincipal';

/**
 * Para a rega que a pessoa esqueceu de registrar na hora. Fica fechada atrás de um link: o botão de cima continua
 * sendo o caminho de um toque para a rega de agora, que é o caso comum.
 */
export function RegaEmOutroDia({
  diaInicial,
  aoRegistrar,
}: {
  /** A data que o campo mostra ao abrir, como DD/MM/AAAA. */
  diaInicial: string;
  /** Registra a rega no dia digitado; falha com `RegaInvalida` quando a data não serve. */
  aoRegistrar: (dia: string) => Promise<void>;
}) {
  const [aberta, definirAberta] = useState(false);
  const [dia, definirDia] = useState(diaInicial);
  const [erro, definirErro] = useState<string | null>(null);
  const [enviando, definirEnviando] = useState(false);

  function abrir() {
    definirDia(diaInicial);
    definirErro(null);
    definirAberta(true);
  }

  async function registrar() {
    if (enviando) return;
    definirEnviando(true);
    try {
      await aoRegistrar(dia);
      definirAberta(false);
    } catch (falha) {
      definirErro(falha instanceof RegaInvalida ? TEXTOS.detalhe.regaInvalida[falha.motivo] : TEXTOS.detalhe.falhaAoRegistrarRega);
    } finally {
      definirEnviando(false);
    }
  }

  if (!aberta) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={TEXTOS.detalhe.regouEmOutroDia}
        onPress={abrir}
        hitSlop={ESPACO.pequeno}
        style={estilos.link}
      >
        <Text style={estilos.textoDoLink}>{TEXTOS.detalhe.regouEmOutroDia}</Text>
      </Pressable>
    );
  }

  return (
    <View style={estilos.formulario}>
      <Text style={TEXTO.rotulo}>{TEXTOS.detalhe.dataDaRega.toUpperCase()}</Text>
      <TextInput
        value={dia}
        onChangeText={(texto) => definirDia(mascararData(texto))}
        accessibilityLabel={TEXTOS.detalhe.dataDaRega}
        placeholder={TEXTOS.colheita.formatoDaData}
        placeholderTextColor={CORES.abaInativa}
        keyboardType="number-pad"
        maxLength={10}
        editable={!enviando}
        style={[estilos.entrada, erro !== null && estilos.entradaComErro]}
      />
      {erro !== null ? (
        <Text style={[TEXTO.apoio, estilos.erro]} accessibilityRole="alert">
          {erro}
        </Text>
      ) : null}
      <View style={estilos.acoes}>
        <BotaoPrincipal titulo={TEXTOS.comum.cancelar} variante="secundaria" aoTocar={() => definirAberta(false)} />
        <BotaoPrincipal
          titulo={enviando ? TEXTOS.detalhe.registrandoRega : TEXTOS.detalhe.registrarRegaNoDia}
          desabilitado={enviando}
          aoTocar={() => void registrar()}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  link: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: ESPACO.pequeno },
  textoDoLink: { ...TEXTO.corpo, fontFamily: FONTES.forte, color: CORES.acaoRega, textDecorationLine: 'underline' },
  formulario: { gap: ESPACO.pequeno },
  entrada: {
    minHeight: 48,
    paddingHorizontal: ESPACO.medio,
    borderWidth: 1.5,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.medio,
    backgroundColor: CORES.superficie,
    fontFamily: FONTES.forte,
    fontSize: 16,
    color: CORES.texto,
  },
  entradaComErro: { borderColor: CORES.erro },
  erro: { color: CORES.erro },
  acoes: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: ESPACO.pequeno },
});

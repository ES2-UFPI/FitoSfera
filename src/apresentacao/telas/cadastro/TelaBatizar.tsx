import { Redirect, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIMITE_DO_APELIDO } from '@/dominio/modelos/Planta';
import { CabecalhoDoCadastro } from '../../cadastro/CabecalhoDoCadastro';
import { VitrineDaPlanta } from '../../cadastro/VitrineDaPlanta';
import { BotaoPrincipal } from '../../componentes/BotaoPrincipal';
import { FundoAconchegante } from '../../componentes/FundoAconchegante';
import { useAplicativo } from '../../contextos/ContextoDoAplicativo';
import { useRascunho } from '../../contextos/RascunhoDoCadastro';
import { CORES } from '../../tema/cores';
import { ESPACO, RAIO } from '../../tema/medidas';
import { FONTES, TEXTO } from '../../tema/tipografia';

/** Passo 3 do cadastro: dar um apelido e colocar a planta na estante. */
export function TelaBatizar() {
  const { especie, aparencia } = useRascunho();
  const { container, recarregarJardim } = useAplicativo();
  const navegador = useRouter();
  const margens = useSafeAreaInsets();
  const [apelido, definirApelido] = useState(especie?.nomeComum ?? '');
  const [erro, definirErro] = useState<string | null>(null);
  const [salvando, definirSalvando] = useState(false);
  // O estado só atualiza no próximo render; a ref barra o segundo toque que chega no mesmo instante.
  const salvandoAgora = useRef(false);

  if (especie === null) return <Redirect href="/cadastro" />;

  const tamanho = Array.from(apelido.trim()).length;
  const valido = tamanho > 0 && tamanho <= LIMITE_DO_APELIDO;

  async function colocarNaEstante() {
    if (especie === null || !valido || salvandoAgora.current) return;
    salvandoAgora.current = true;
    definirSalvando(true);
    definirErro(null);
    try {
      await container.adicionarPlanta.executar({ idEspecie: especie.id, apelido, aparencia });
      await recarregarJardim();
      navegador.dismissTo('/');
    } catch (falha) {
      definirErro(falha instanceof Error ? falha.message : 'Não deu para salvar a planta. Tente de novo.');
      salvandoAgora.current = false;
      definirSalvando(false);
    }
  }

  return (
    <FundoAconchegante style={{ paddingTop: margens.top + ESPACO.pequeno }}>
      <KeyboardAvoidingView style={estilos.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <CabecalhoDoCadastro passoAtual={3} />
        <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <Text style={[TEXTO.subtitulo, estilos.titulo]} accessibilityRole="header">
            Como você vai chamar esta planta?
          </Text>
          <VitrineDaPlanta aparencia={aparencia} etiqueta={apelido.trim() || especie.nomeComum} />

          <View style={estilos.campo}>
            <TextInput
              value={apelido}
              onChangeText={definirApelido}
              accessibilityLabel="Apelido da planta"
              placeholder={especie.nomeComum}
              placeholderTextColor={CORES.abaInativa}
              autoCapitalize="sentences"
              returnKeyType="done"
              onSubmitEditing={() => void colocarNaEstante()}
              style={estilos.entrada}
            />
          </View>
          <View style={estilos.ajuda}>
            <Text style={[estilos.textoDeAjuda, erro !== null && estilos.erro]}>
              {erro ?? 'Esse nome aparece na etiqueta da estante.'}
            </Text>
            <Text style={[estilos.textoDeAjuda, tamanho > LIMITE_DO_APELIDO && estilos.erro]}>
              {tamanho}/{LIMITE_DO_APELIDO}
            </Text>
          </View>
        </ScrollView>
        <View style={[estilos.rodape, { paddingBottom: margens.bottom + ESPACO.grande }]}>
          <BotaoPrincipal
            titulo="Colocar na estante"
            largo
            desabilitado={!valido || salvando}
            aoTocar={() => void colocarNaEstante()}
          />
        </View>
      </KeyboardAvoidingView>
    </FundoAconchegante>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { paddingBottom: ESPACO.folgado },
  titulo: { paddingHorizontal: ESPACO.amplo, marginTop: ESPACO.medio },
  campo: {
    marginHorizontal: ESPACO.amplo,
    marginTop: ESPACO.folgado,
    paddingHorizontal: ESPACO.grande,
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: RAIO.medio,
    borderWidth: 1.5,
    borderColor: CORES.bordaSuave,
    backgroundColor: CORES.superficie,
  },
  entrada: { fontFamily: FONTES.forte, fontSize: 16, color: CORES.texto, paddingVertical: ESPACO.medio },
  ajuda: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ESPACO.medio,
    marginHorizontal: ESPACO.amplo,
    marginTop: ESPACO.pequeno,
  },
  textoDeAjuda: { ...TEXTO.apoio, flexShrink: 1 },
  erro: { color: CORES.erro },
  rodape: { paddingHorizontal: ESPACO.amplo, paddingTop: ESPACO.medio },
});

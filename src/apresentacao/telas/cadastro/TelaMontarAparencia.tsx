import { Redirect, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DESTAQUES, FOLHAGENS, VASOS } from '@/dominio/modelos/Aparencia';
import { AmostrasDeCor } from '../../cadastro/AmostrasDeCor';
import { CabecalhoDoCadastro } from '../../cadastro/CabecalhoDoCadastro';
import { SeletorDeForma } from '../../cadastro/SeletorDeForma';
import { VitrineDaPlanta } from '../../cadastro/VitrineDaPlanta';
import { BotaoPrincipal } from '../../componentes/BotaoPrincipal';
import { FundoAconchegante } from '../../componentes/FundoAconchegante';
import { useRascunho } from '../../contextos/RascunhoDoCadastro';
import { CORES_DAS_FOLHAGENS, CORES_DOS_DESTAQUES, CORES_DOS_VASOS, FORMAS_VISUAIS } from '../../ilustracao/paletas';
import { CORES } from '../../tema/cores';
import { ESPACO } from '../../tema/medidas';
import { TEXTO } from '../../tema/tipografia';

const OPCOES_DE_FOLHAGEM = FOLHAGENS.map((id) => {
  const { nome, folha, folhaClara } = CORES_DAS_FOLHAGENS[id];
  return { id, nome, cores: [folha, folhaClara] };
});
const OPCOES_DE_DESTAQUE = DESTAQUES.map((id) => ({
  id,
  nome: CORES_DOS_DESTAQUES[id].nome,
  cores: [CORES_DOS_DESTAQUES[id].cor],
}));
const OPCOES_DE_VASO = VASOS.map((id) => {
  const { nome, corpo, borda } = CORES_DOS_VASOS[id];
  return { id, nome, cores: [corpo, borda] };
});

/** Passo 2 do cadastro: a pessoa monta a aparência da planta, livre para qualquer espécie. */
export function TelaMontarAparencia() {
  const { especie, aparencia, mudarAparencia } = useRascunho();
  const navegador = useRouter();
  const margens = useSafeAreaInsets();

  if (especie === null) return <Redirect href="/cadastro" />;
  const rotuloDoDestaque = FORMAS_VISUAIS[aparencia.forma].rotuloDestaque;

  return (
    <FundoAconchegante style={{ paddingTop: margens.top + ESPACO.pequeno }}>
      <CabecalhoDoCadastro passoAtual={2} />
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={[TEXTO.subtitulo, estilos.titulo]} accessibilityRole="header">
          Como vai ser a sua planta?
        </Text>
        <VitrineDaPlanta aparencia={aparencia} etiqueta={especie.nomeComum} />

        <View style={estilos.secoes}>
          <View style={estilos.secaoDeForma}>
            <View style={estilos.cabecalhoDaForma}>
              <Text style={TEXTO.rotulo}>FORMA</Text>
              <Text style={estilos.nomeEscolhido}>{FORMAS_VISUAIS[aparencia.forma].nome}</Text>
            </View>
            <SeletorDeForma aparencia={aparencia} aoEscolher={(forma) => mudarAparencia({ forma })} />
          </View>
          <AmostrasDeCor
            rotulo="Folhagem"
            formato="folha"
            opcoes={OPCOES_DE_FOLHAGEM}
            selecionada={aparencia.folhagem}
            aoEscolher={(folhagem) => mudarAparencia({ folhagem })}
          />
          {rotuloDoDestaque !== null ? (
            <AmostrasDeCor
              rotulo={rotuloDoDestaque}
              formato="redonda"
              opcoes={OPCOES_DE_DESTAQUE}
              selecionada={aparencia.destaque}
              aoEscolher={(destaque) => mudarAparencia({ destaque })}
            />
          ) : null}
          <AmostrasDeCor
            rotulo="Vaso"
            formato="vaso"
            opcoes={OPCOES_DE_VASO}
            selecionada={aparencia.vaso}
            aoEscolher={(vaso) => mudarAparencia({ vaso })}
          />
        </View>
      </ScrollView>
      <View style={[estilos.rodape, { paddingBottom: margens.bottom + ESPACO.grande }]}>
        <BotaoPrincipal titulo="Continuar" largo aoTocar={() => navegador.push('/cadastro/apelido')} />
      </View>
    </FundoAconchegante>
  );
}

const estilos = StyleSheet.create({
  conteudo: { paddingBottom: ESPACO.folgado },
  titulo: { paddingHorizontal: ESPACO.amplo, marginTop: ESPACO.medio },
  secoes: { gap: ESPACO.grande, marginTop: ESPACO.amplo },
  secaoDeForma: { gap: 6 },
  cabecalhoDaForma: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: ESPACO.amplo,
  },
  nomeEscolhido: { ...TEXTO.apoio, fontSize: 11.5, color: CORES.textoApoio },
  rodape: { paddingHorizontal: ESPACO.amplo, paddingTop: ESPACO.medio },
});

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SensorPareado } from '@/aplicacao/portas/PareamentoDoSensor';
import { BotaoFlutuante } from '../componentes/BotaoFlutuante';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { CabecalhoDoJardim } from '../componentes/CabecalhoDoJardim';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { Estante } from '../estante/Estante';
import { EstadoVazio } from './EstadoVazio';
import { CORES } from '../tema/cores';
import { ALVO_DE_TOQUE, ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';

export function TelaJardim() {
  const {
    container,
    plantas,
    jardins,
    idJardimSelecionado,
    selecionarJardim,
    criarJardim,
    recarregarJardins,
    recarregarJardim,
  } = useAplicativo();
  const [seletorAberto, definirSeletorAberto] = useState(false);
  const [novoNome, definirNovoNome] = useState('');
  const [erroDoJardim, definirErroDoJardim] = useState(false);
  const [sensores, definirSensores] = useState<readonly SensorPareado[]>([]);
  const [erroDoSensor, definirErroDoSensor] = useState('');
  const [listaDeSensoresAberta, definirListaDeSensoresAberta] = useState(false);
  const margens = useSafeAreaInsets();
  const navegador = useRouter();

  useFocusEffect(
    useCallback(() => {
      let ativa = true;
      void recarregarJardim();
      void recarregarJardins().catch(() => {
        if (ativa) definirErroDoJardim(true);
      });
      void container.pareamentoDoSensor?.listarPareados?.().then(
        (lista) => { if (ativa) definirSensores(lista); },
        () => { if (ativa) definirErroDoSensor('Não deu para carregar os sensores pareados.'); },
      );
      return () => { ativa = false; };
    }, [container, recarregarJardim, recarregarJardins]),
  );

  const abrirCadastro = () => navegador.push('/cadastro');
  const abrirPlanta = (id: string) => navegador.push({ pathname: '/planta/[id]', params: { id } });
  const lista = plantas ?? [];
  const jardimAtual = jardins.find((jardim) => jardim.id === idJardimSelecionado);
  const nomeDoJardim = jardimAtual?.nome ?? 'Jardim principal';
  const sensorSimulado = jardimAtual?.idSensor?.startsWith('simulado') ?? false;
  const sensorFisico = sensores.find((sensor) => sensor.id === jardimAtual?.idSensor);
  const statusDoSensor = sensorSimulado
    ? 'Sensor simulado associado'
    : sensorFisico?.nome ?? (jardimAtual?.idSensor ? 'Sensor físico associado' : 'Nenhum sensor associado');

  async function trocarJardim(id: string) {
    try {
      await selecionarJardim(id);
      definirSeletorAberto(false);
      definirErroDoJardim(false);
    } catch {
      definirErroDoJardim(true);
    }
  }

  async function criar() {
    try {
      await criarJardim(novoNome);
      definirNovoNome('');
      definirSeletorAberto(false);
      definirErroDoJardim(false);
    } catch {
      definirErroDoJardim(true);
    }
  }

  async function atualizarJardimDepoisDaAssociacao() {
    await recarregarJardins();
    await recarregarJardim();
    definirErroDoSensor('');
    definirListaDeSensoresAberta(false);
  }

  async function alterarSensorFisico(idSensor: string | null) {
    try {
      if (idSensor === null) await container.gerenciarJardins.desassociar(idJardimSelecionado);
      else await container.gerenciarJardins.associar(idJardimSelecionado, idSensor);
      await atualizarJardimDepoisDaAssociacao();
    } catch (falha) {
      definirErroDoSensor(falha instanceof Error ? falha.message : 'Não foi possível alterar o sensor.');
    }
  }

  return (
    <FundoAconchegante style={{ paddingTop: margens.top }}>
        <View style={estilos.cartaoDoJardim}>
          <Text style={TEXTO.rotulo}>JARDIM ATUAL</Text>
          <Text style={estilos.nomeDoJardim} numberOfLines={1}>{nomeDoJardim}</Text>
          <Text style={TEXTO.apoio}>{lista.length} {lista.length === 1 ? 'planta' : 'plantas'} neste espaço</Text>
          <BotaoPrincipal
            titulo="Trocar ou criar jardim"
            variante="secundaria"
            largo
            aoTocar={() => definirSeletorAberto(true)}
          />
        </View>

        <View style={estilos.cabecalhoJardim}>
          <CabecalhoDoJardim quantidade={lista.length} />
        </View>

        {container.pareamentoDoSensor || container.controleDoSensorDeDesenvolvimento ? (
          <View style={estilos.cartaoDoSensor}>
            <View style={estilos.cabecalhoDoSensor}>
              <View style={[estilos.pontoDoSensor, (sensorFisico || sensorSimulado) && estilos.pontoAtivo]} />
              <View style={estilos.detalheDoSensor}>
                <Text style={TEXTO.rotulo}>SENSOR DO AMBIENTE</Text>
                <Text style={estilos.statusDoSensor}>{statusDoSensor}</Text>
              </View>
            </View>
            <Text style={TEXTO.apoio}>As leituras deste sensor aparecem somente nas plantas deste jardim.</Text>

            {container.pareamentoDoSensor ? (
              <View style={estilos.acoesDoSensor}>
                <BotaoPrincipal
                  titulo={listaDeSensoresAberta ? 'Fechar lista de sensores' : sensorFisico ? 'Trocar sensor físico' : 'Associar sensor físico'}
                  variante="secundaria"
                  largo
                  aoTocar={() => definirListaDeSensoresAberta((aberta) => !aberta)}
                />
                {listaDeSensoresAberta ? (
                  <>
                    {sensores.map((sensor) => (
                      <BotaoPrincipal
                        key={sensor.id}
                        titulo={`${sensor.id === jardimAtual?.idSensor ? 'Associado: ' : 'Associar '}${sensor.nome} · ${sensor.id.slice(-5)}`}
                        variante="secundaria"
                        largo
                        aoTocar={() => void alterarSensorFisico(sensor.id)}
                      />
                    ))}
                    <BotaoPrincipal titulo="Parear novo sensor" variante="secundaria" largo
                      aoTocar={() => navegador.push('/sensor')} />
                  </>
                ) : null}
                {jardimAtualTemSensorFisico(jardimAtual?.idSensor) ? (
                  <BotaoPrincipal titulo="Desassociar sensor físico" variante="secundaria" largo
                    aoTocar={() => void alterarSensorFisico(null)} />
                ) : null}
              </View>
            ) : null}

            {erroDoSensor ? <Text style={estilos.erroDoSensor} accessibilityRole="alert">{erroDoSensor}</Text> : null}
          </View>
        ) : null}

        {lista.length > 0 ? (
          <>
            <Estante plantas={lista} aoAbrirPlanta={abrirPlanta} aoCadastrar={abrirCadastro} />
            <BotaoFlutuante aoTocar={abrirCadastro} />
          </>
        ) : null}
        {plantas !== null && plantas.length === 0 ? <EstadoVazio aoComecar={abrirCadastro} /> : null}
      <Modal visible={seletorAberto} transparent animationType="fade" onRequestClose={() => definirSeletorAberto(false)}>
        <Pressable style={estilos.fundoDoModal} onPress={() => definirSeletorAberto(false)} accessible={false}>
          <Pressable style={estilos.modal} accessibilityViewIsModal onPress={() => undefined}>
            <Text style={TEXTO.subtitulo} accessibilityRole="header">Seus jardins</Text>
            <Text style={TEXTO.apoio}>Escolha o espaço que quer acompanhar.</Text>
            <ScrollView style={estilos.listaDeJardins} showsVerticalScrollIndicator={false}>
              {jardins.map((jardim) => {
                const selecionado = jardim.id === idJardimSelecionado;
                return (
                  <Pressable key={jardim.id} accessibilityRole="button" accessibilityState={{ selected: selecionado }}
                    onPress={() => void trocarJardim(jardim.id)} style={[estilos.opcaoDeJardim, selecionado && estilos.jardimSelecionado]}>
                    <View style={estilos.detalheDaOpcao}>
                      <Text style={estilos.nomeDaOpcao}>{jardim.nome}</Text>
                      <Text style={TEXTO.apoio}>{selecionado ? `${lista.length} ${lista.length === 1 ? 'planta' : 'plantas'}` : 'Toque para abrir'}</Text>
                    </View>
                    {selecionado ? <Text style={estilos.seloAtual}>ATUAL</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Text style={TEXTO.rotulo}>NOVO JARDIM</Text>
            <TextInput accessibilityLabel="Nome do novo jardim" value={novoNome} onChangeText={definirNovoNome}
              placeholder="Ex.: Varanda" placeholderTextColor={CORES.textoApoio} style={estilos.entrada} />
            {erroDoJardim ? <Text style={estilos.erroDoSensor} accessibilityRole="alert">Não deu para criar ou abrir o jardim. Confira o nome e tente novamente.</Text> : null}
            <View style={estilos.acoesDoModal}>
              <BotaoPrincipal titulo="Cancelar" variante="secundaria" aoTocar={() => definirSeletorAberto(false)} />
              <BotaoPrincipal titulo="Criar jardim" aoTocar={() => void criar()} desabilitado={!novoNome.trim()} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </FundoAconchegante>
  );
}

function jardimAtualTemSensorFisico(idSensor: string | null | undefined): boolean {
  return idSensor !== undefined && idSensor !== null && !idSensor.startsWith('simulado');
}

const estilos = StyleSheet.create({
  cartaoDoJardim: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    marginHorizontal: ESPACO.grande,
    padding: ESPACO.grande,
    gap: ESPACO.pequeno,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.grande,
    backgroundColor: CORES.superficie,
  },
  cabecalhoJardim: { width: '100%', maxWidth: 560, alignSelf: 'center' },
  nomeDoJardim: { fontFamily: FONTES.titulo, fontSize: 27, lineHeight: 32, color: CORES.texto },
  cartaoDoSensor: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    marginHorizontal: ESPACO.grande,
    padding: ESPACO.grande,
    gap: ESPACO.medio,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.grande,
    backgroundColor: CORES.superficie,
  },
  cabecalhoDoSensor: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.medio },
  pontoDoSensor: { width: 11, height: 11, borderRadius: RAIO.pilula, backgroundColor: CORES.statusSemDados },
  pontoAtivo: { backgroundColor: CORES.statusOk },
  detalheDoSensor: { flex: 1, gap: ESPACO.minimo },
  statusDoSensor: { fontFamily: FONTES.forte, fontSize: 14, color: CORES.texto },
  acoesDoSensor: { gap: ESPACO.pequeno },
  erroDoSensor: { ...TEXTO.apoio, color: CORES.erro },
  fundoDoModal: { flex: 1, justifyContent: 'center', padding: ESPACO.grande, backgroundColor: 'rgba(61, 51, 38, 0.48)' },
  modal: { width: '100%', maxWidth: 460, maxHeight: '85%', alignSelf: 'center', padding: ESPACO.folgado,
    gap: ESPACO.medio, borderRadius: RAIO.grande, backgroundColor: CORES.superficie },
  listaDeJardins: { flexGrow: 0, maxHeight: 250 },
  opcaoDeJardim: { minHeight: ALVO_DE_TOQUE + 8, flexDirection: 'row', alignItems: 'center', marginBottom: ESPACO.pequeno,
    padding: ESPACO.medio, borderWidth: 1, borderColor: CORES.bordaSuave, borderRadius: RAIO.medio,
    backgroundColor: CORES.fundoTopo },
  jardimSelecionado: { borderColor: CORES.acao, backgroundColor: CORES.papel },
  detalheDaOpcao: { flex: 1, gap: ESPACO.minimo },
  nomeDaOpcao: { ...TEXTO.corpo, color: CORES.texto, fontFamily: FONTES.forte },
  seloAtual: { ...TEXTO.rotulo, color: CORES.acao },
  entrada: { minHeight: ALVO_DE_TOQUE, paddingHorizontal: ESPACO.medio, borderWidth: 1,
    borderColor: CORES.bordaSuave, borderRadius: RAIO.medio, color: CORES.texto, backgroundColor: CORES.fundoTopo },
  acoesDoModal: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: ESPACO.pequeno },
});

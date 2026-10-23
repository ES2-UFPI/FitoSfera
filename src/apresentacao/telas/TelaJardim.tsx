import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BotaoFlutuante } from '../componentes/BotaoFlutuante';
import { CabecalhoDoJardim } from '../componentes/CabecalhoDoJardim';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { Estante } from '../estante/Estante';
import { EstadoVazio } from './EstadoVazio';
import { CORES } from '../tema/cores';
import { ALVO_DE_TOQUE, ESPACO, RAIO } from '../tema/medidas';
import { TEXTO } from '../tema/tipografia';
import { SensorPareado } from '@/aplicacao/portas/PareamentoDoSensor';

/** Aba inicial: a estante com as plantas da pessoa. */
export function TelaJardim() {
  const { container, plantas, jardins, idJardimSelecionado, selecionarJardim, criarJardim,
    recarregarJardins, recarregarJardim } = useAplicativo();
  const [aberto, definirAberto] = useState(false);
  const [novoNome, definirNovoNome] = useState('');
  const [erro, definirErro] = useState(false);
  const [sensores, definirSensores] = useState<readonly SensorPareado[]>([]);
  const [erroDoSensor, definirErroDoSensor] = useState('');
  const [sensoresAbertos, definirSensoresAbertos] = useState(false);
  const margens = useSafeAreaInsets();
  const navegador = useRouter();

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      void recarregarJardim();
      void container.pareamentoDoSensor?.listarPareados?.().then((lista) => {
        if (ativo) definirSensores(lista);
      }, () => { if (ativo) definirErroDoSensor('Não deu para listar os sensores pareados.'); });
      void recarregarJardins().catch(() => { if (ativo) definirErro(true); });
      return () => { ativo = false; };
    }, [container, recarregarJardim, recarregarJardins]),
  );

  const abrirCadastro = () => navegador.push('/cadastro');
  const abrirPlanta = (id: string) => navegador.push({ pathname: '/planta/[id]', params: { id } });
  const lista = plantas ?? [];
  const nome = jardins.find((jardim) => jardim.id === idJardimSelecionado)?.nome ?? 'Jardim principal';
  const jardimAtual = jardins.find((jardim) => jardim.id === idJardimSelecionado);

  async function alterarSensor(idSensor: string | null) {
    try {
      if (idSensor === null) await container.gerenciarJardins.desassociar(idJardimSelecionado);
      else await container.gerenciarJardins.associar(idJardimSelecionado, idSensor);
      definirErroDoSensor('');
      definirSensoresAbertos(false);
      await recarregarJardins();
      await recarregarJardim();
    } catch (falha) {
      definirErroDoSensor(falha instanceof Error ? falha.message : 'Não foi possível associar o sensor.');
    }
  }

  async function alternarSensorSimulado() {
    try {
      if (jardimAtual?.idSensor?.startsWith('simulado'))
        await container.gerenciarJardins.desassociar(idJardimSelecionado);
      else await container.gerenciarJardins.associarSensorSimulado(idJardimSelecionado);
      definirErroDoSensor('');
      await recarregarJardins();
      await recarregarJardim();
    } catch (falha) {
      definirErroDoSensor(falha instanceof Error ? falha.message : 'Não foi possível alterar o sensor simulado.');
    }
  }

  async function criar() {
    try {
      await criarJardim(novoNome);
      definirNovoNome('');
      definirAberto(false);
      definirErro(false);
    } catch {
      definirErro(true);
    }
  }

  return (
    <FundoAconchegante style={{ paddingTop: margens.top }}>
      <View style={estilos.seletor}>
        <Pressable style={estilos.acao} accessibilityRole="button" accessibilityLabel={`Trocar de jardim. Atual: ${nome}`} onPress={() => definirAberto(!aberto)}>
          <Text style={TEXTO.subtitulo}>{nome} ▾</Text>
        </Pressable>
        {aberto ? (
          <View style={estilos.opcoes}>
            {jardins.map((jardim) => (
              <Pressable key={jardim.id} style={estilos.acao} accessibilityRole="button"
                accessibilityState={{ selected: jardim.id === idJardimSelecionado }} onPress={() => {
                void selecionarJardim(jardim.id).then(() => definirAberto(false), () => definirErro(true));
              }}>
                <Text style={TEXTO.corpo}>{jardim.nome}</Text>
              </Pressable>
            ))}
            <TextInput accessibilityLabel="Nome do novo jardim" value={novoNome} onChangeText={definirNovoNome}
              placeholder="Nome do novo jardim" style={estilos.entrada} />
            <Pressable style={estilos.acao} accessibilityRole="button" onPress={() => void criar()}><Text style={TEXTO.corpo}>Criar jardim</Text></Pressable>
            {erro ? <Text accessibilityRole="alert">Não deu para criar o jardim. Confira o nome e tente novamente.</Text> : null}
          </View>
        ) : null}
      </View>
      <CabecalhoDoJardim quantidade={lista.length} />
      {container.pareamentoDoSensor ? (
        <View style={estilos.seletor}>
          <Text style={TEXTO.apoio}>Sensor deste jardim: {sensores.find((sensor) => sensor.id === jardimAtual?.idSensor)?.nome ?? 'nenhum'}</Text>
          <Pressable style={estilos.acao} accessibilityRole="button" onPress={() => definirSensoresAbertos(!sensoresAbertos)}>
            <Text style={TEXTO.corpo}>{sensoresAbertos ? 'Fechar sensores' : 'Associar ou trocar sensor'}</Text>
          </Pressable>
          {sensoresAbertos ? sensores.map((sensor) => (
            <Pressable key={sensor.id} style={estilos.acao} accessibilityRole="button"
              onPress={() => void alterarSensor(sensor.id)}>
              <Text style={TEXTO.corpo}>Associar {sensor.nome} · {sensor.id.slice(-5)}</Text>
            </Pressable>
          )) : null}
          {jardimAtual?.idSensor ? <Pressable style={estilos.acao} accessibilityRole="button" onPress={() => void alterarSensor(null)}>
            <Text style={TEXTO.corpo}>Desassociar sensor</Text>
          </Pressable> : null}
          {sensoresAbertos ? <Pressable style={estilos.acao} accessibilityRole="button" onPress={() => navegador.push('/sensor')}>
            <Text style={TEXTO.corpo}>Parear novo sensor</Text>
          </Pressable> : null}
          {erroDoSensor ? <Text accessibilityRole="alert">{erroDoSensor}</Text> : null}
        </View>
      ) : null}
      {container.controleDoSensorDeDesenvolvimento ? (
        <View style={estilos.seletor}>
          <Text style={TEXTO.apoio}>Sensor deste jardim: {jardimAtual?.idSensor?.startsWith('simulado') ? 'Simulado' : 'nenhum'}</Text>
          <Pressable style={estilos.acao} accessibilityRole="button" onPress={() => void alternarSensorSimulado()}>
            <Text style={TEXTO.corpo}>{jardimAtual?.idSensor?.startsWith('simulado') ? 'Desassociar sensor' : 'Associar sensor simulado'}</Text>
          </Pressable>
          {erroDoSensor ? <Text accessibilityRole="alert">{erroDoSensor}</Text> : null}
        </View>
      ) : null}
      {lista.length > 0 ? (
        <>
          <Estante plantas={lista} aoAbrirPlanta={abrirPlanta} aoCadastrar={abrirCadastro} />
          <BotaoFlutuante aoTocar={abrirCadastro} />
        </>
      ) : null}
      {plantas !== null && plantas.length === 0 ? <EstadoVazio aoComecar={abrirCadastro} /> : null}
    </FundoAconchegante>
  );
}

const estilos = StyleSheet.create({
  seletor: { paddingHorizontal: ESPACO.grande, gap: ESPACO.pequeno },
  opcoes: { padding: ESPACO.medio, gap: ESPACO.medio, backgroundColor: CORES.superficie },
  entrada: { borderWidth: 1, borderColor: CORES.bordaSuave, padding: ESPACO.pequeno, color: CORES.texto },
  acao: { minHeight: ALVO_DE_TOQUE, justifyContent: 'center', paddingHorizontal: ESPACO.pequeno,
    borderRadius: RAIO.pequeno },
});

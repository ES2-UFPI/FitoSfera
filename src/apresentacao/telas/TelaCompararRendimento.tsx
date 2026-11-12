import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ComparacaoDeRendimento,
  MINIMO_DE_PLANTAS_PARA_COMPARAR,
} from '@/aplicacao/casos-de-uso/CompararRendimento';
import { UnidadeDeColheita } from '@/dominio/modelos/RegistroDeColheita';
import { TEXTOS } from '@/textos';
import { descreverQuantidade } from '../colheita/FormularioDeColheita';
import { BotaoVoltar } from '../componentes/BotaoVoltar';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { CORES } from '../tema/cores';
import { ALVO_DE_TOQUE, ESPACO, RAIO } from '../tema/medidas';
import { FONTES, TEXTO } from '../tema/tipografia';

const PERIODOS = [7, 30, 90, 365] as const;
type Periodo = (typeof PERIODOS)[number];

const MEDIDAS: readonly { unidade: UnidadeDeColheita; titulo: string }[] = [
  { unidade: 'unidades', titulo: TEXTOS.rendimento.contados },
  { unidade: 'gramas', titulo: TEXTOS.rendimento.pesados },
];

type Resultado =
  | { readonly tipo: 'poucas' }
  | { readonly tipo: 'calculando' }
  | { readonly tipo: 'falhou' }
  | { readonly tipo: 'pronto'; readonly comparacao: ComparacaoDeRendimento };

/** Compara o rendimento das plantas frutíferas do jardim atual; `idInicial` já vem escolhida. */
export function TelaCompararRendimento({ idInicial }: { idInicial?: string }) {
  const { container, plantas } = useAplicativo();
  const margens = useSafeAreaInsets();
  const frutiferas = useMemo(() => (plantas ?? []).filter((item) => item.especie?.frutifera), [plantas]);
  const [escolhidas, definirEscolhidas] = useState<ReadonlySet<string>>(
    () => new Set(idInicial ? [idInicial] : []),
  );
  const [dias, definirDias] = useState<Periodo>(30);
  const [unidade, definirUnidade] = useState<UnidadeDeColheita>('unidades');
  const [resultado, definirResultado] = useState<Resultado>({ tipo: 'poucas' });

  const idsEscolhidos = frutiferas.map((item) => item.planta.id).filter((id) => escolhidas.has(id));
  const chaveDaEscolha = idsEscolhidos.join('|');

  useEffect(() => {
    if (idsEscolhidos.length < MINIMO_DE_PLANTAS_PARA_COMPARAR) {
      definirResultado({ tipo: 'poucas' });
      return;
    }
    let atual = true;
    definirResultado({ tipo: 'calculando' });
    container.compararRendimento.executar({ idsDasPlantas: idsEscolhidos, dias, unidade }).then(
      (comparacao) => atual && definirResultado({ tipo: 'pronto', comparacao }),
      (falha) => {
        console.warn('Não deu para comparar o rendimento.', falha);
        if (atual) definirResultado({ tipo: 'falhou' });
      },
    );
    return () => {
      atual = false;
    };
    // A chave resume a escolha: o array muda de identidade a cada render.
  }, [container, chaveDaEscolha, dias, unidade]);

  function alternar(id: string) {
    definirEscolhidas((anteriores) => {
      const proximas = new Set(anteriores);
      if (proximas.has(id)) proximas.delete(id);
      else proximas.add(id);
      return proximas;
    });
  }

  return (
    <FundoAconchegante style={{ paddingTop: margens.top + ESPACO.pequeno }}>
      <View style={estilos.topo}>
        <BotaoVoltar />
      </View>
      <ScrollView contentContainerStyle={[estilos.conteudo, { paddingBottom: margens.bottom + ESPACO.folgado }]}>
        <Text style={TEXTO.titulo} accessibilityRole="header">
          {TEXTOS.rendimento.titulo}
        </Text>
        <Text style={TEXTO.corpo}>{TEXTOS.rendimento.explicacao}</Text>

        {frutiferas.length < MINIMO_DE_PLANTAS_PARA_COMPARAR ? (
          <Text style={[TEXTO.corpo, estilos.aviso]}>{TEXTOS.rendimento.poucasFrutiferas}</Text>
        ) : (
          <>
            <Grupo rotulo={TEXTOS.rendimento.rotuloDoPeriodo}>
              {PERIODOS.map((periodo) => (
                <Opcao
                  key={periodo}
                  titulo={TEXTOS.rendimento.periodos[periodo]}
                  escolhida={periodo === dias}
                  aoTocar={() => definirDias(periodo)}
                />
              ))}
            </Grupo>

            <Grupo rotulo={TEXTOS.rendimento.rotuloDaMedida}>
              {MEDIDAS.map((medida) => (
                <Opcao
                  key={medida.unidade}
                  titulo={medida.titulo}
                  escolhida={medida.unidade === unidade}
                  aoTocar={() => definirUnidade(medida.unidade)}
                />
              ))}
            </Grupo>

            <View style={estilos.grupo}>
              <Text style={TEXTO.rotulo}>{TEXTOS.rendimento.rotuloDasPlantas}</Text>
              {frutiferas.map(({ planta, especie }) => {
                const escolhida = escolhidas.has(planta.id);
                const descricao = TEXTOS.rendimento.plantaEscolhida(
                  planta.apelido,
                  especie?.nomeComum ?? TEXTOS.comum.especieDesconhecida,
                );
                return (
                  <Pressable
                    key={planta.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: escolhida }}
                    accessibilityLabel={descricao}
                    onPress={() => alternar(planta.id)}
                    style={({ pressed }) => [estilos.planta, escolhida && estilos.plantaEscolhida, pressed && estilos.pressionado]}
                  >
                    <View style={[estilos.caixa, escolhida && estilos.caixaMarcada]}>
                      {escolhida ? <Text style={estilos.marca}>{TEXTOS.rendimento.marcaDeEscolhida}</Text> : null}
                    </View>
                    <View style={estilos.flexivel}>
                      <Text style={estilos.apelido}>{planta.apelido}</Text>
                      <Text style={TEXTO.apoio}>{especie?.nomeComum ?? TEXTOS.comum.especieDesconhecida}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Resultados resultado={resultado} />
          </>
        )}
      </ScrollView>
    </FundoAconchegante>
  );
}

function Resultados({ resultado }: { resultado: Resultado }) {
  if (resultado.tipo === 'poucas') {
    return <Text style={[TEXTO.corpo, estilos.aviso]}>{TEXTOS.rendimento.escolhaMaisUma}</Text>;
  }
  if (resultado.tipo === 'calculando') {
    return <Text style={TEXTO.corpo}>{TEXTOS.rendimento.calculando}</Text>;
  }
  if (resultado.tipo === 'falhou') {
    return (
      <Text style={[TEXTO.corpo, estilos.erro]} accessibilityRole="alert">
        {TEXTOS.rendimento.falha}
      </Text>
    );
  }
  const maior = resultado.comparacao.plantas[0]?.rendimento.quantidadeTotal ?? 0;
  return (
    <View style={estilos.grupo} accessibilityLiveRegion="polite">
      <Text style={TEXTO.rotulo}>{TEXTOS.rendimento.rotuloDoResultado}</Text>
      {resultado.comparacao.plantas.map(({ planta, rendimento }, indice) => {
        const total = descreverQuantidade({ quantidade: rendimento.quantidadeTotal, unidade: rendimento.unidade });
        const colheitas = TEXTOS.rendimento.colheitas(rendimento.numeroDeColheitas);
        const proporcao = maior > 0 ? rendimento.quantidadeTotal / maior : 0;
        return (
          <View
            key={planta.id}
            style={estilos.linhaDoResultado}
            accessible
            accessibilityLabel={TEXTOS.rendimento.linhaDoResultado(indice + 1, planta.apelido, total, colheitas)}
          >
            <Text style={estilos.posicao}>{TEXTOS.rendimento.posicao(indice + 1)}</Text>
            <View style={estilos.flexivel}>
              <View style={estilos.cabecalhoDoResultado}>
                <Text style={[estilos.apelido, estilos.flexivel]}>{planta.apelido}</Text>
                <Text style={estilos.total}>{total}</Text>
              </View>
              <View style={estilos.trilho}>
                <View style={[estilos.barra, { width: `${Math.round(proporcao * 100)}%` }]} />
              </View>
              <Text style={TEXTO.apoio}>{colheitas}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Grupo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <View style={estilos.grupo}>
      <Text style={TEXTO.rotulo}>{rotulo}</Text>
      <View style={estilos.opcoes} accessibilityRole="radiogroup">
        {children}
      </View>
    </View>
  );
}

function Opcao({ titulo, escolhida, aoTocar }: { titulo: string; escolhida: boolean; aoTocar(): void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: escolhida }}
      accessibilityLabel={titulo}
      onPress={aoTocar}
      style={({ pressed }) => [estilos.opcao, escolhida && estilos.opcaoEscolhida, pressed && estilos.pressionado]}
    >
      <Text style={[estilos.textoDaOpcao, escolhida && estilos.textoDaOpcaoEscolhida]}>{titulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  topo: { paddingHorizontal: ESPACO.grande },
  conteudo: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: ESPACO.grande, gap: ESPACO.amplo },
  grupo: { gap: ESPACO.pequeno },
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
  textoDaOpcao: { fontFamily: FONTES.forte, fontSize: 14, color: CORES.textoApoio },
  textoDaOpcaoEscolhida: { color: CORES.acao },
  planta: {
    minHeight: ALVO_DE_TOQUE + ESPACO.pequeno,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACO.medio,
    padding: ESPACO.medio,
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.medio,
    backgroundColor: CORES.superficie,
  },
  plantaEscolhida: { borderColor: CORES.acao, backgroundColor: CORES.papel },
  caixa: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.pequeno,
    backgroundColor: CORES.superficie,
  },
  caixaMarcada: { borderColor: CORES.acao, backgroundColor: CORES.acao },
  marca: { fontFamily: FONTES.forte, fontSize: 14, color: CORES.textoDaAcao },
  flexivel: { flex: 1 },
  apelido: { fontFamily: FONTES.forte, fontSize: 15, color: CORES.texto },
  pressionado: { opacity: 0.72 },
  linhaDoResultado: {
    flexDirection: 'row',
    gap: ESPACO.medio,
    padding: ESPACO.medio,
    borderRadius: RAIO.medio,
    backgroundColor: CORES.superficie,
  },
  posicao: { width: 32, fontFamily: FONTES.titulo, fontSize: 20, color: CORES.acao },
  cabecalhoDoResultado: { flexDirection: 'row', alignItems: 'baseline', gap: ESPACO.pequeno },
  total: { fontFamily: FONTES.forte, fontSize: 15, color: CORES.texto },
  trilho: { height: 8, marginVertical: ESPACO.minimo, borderRadius: RAIO.pilula, backgroundColor: CORES.bordaSuave },
  barra: { height: 8, borderRadius: RAIO.pilula, backgroundColor: CORES.acao },
  aviso: { color: CORES.texto },
  erro: { color: CORES.erro },
});

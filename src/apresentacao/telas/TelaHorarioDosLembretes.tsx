import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HorarioDoDia,
  JANELA_PADRAO,
  JanelaDeLembretes,
} from '@/dominio/modelos/JanelaDeLembretes';
import { deslocarHorario } from '@/dominio/regras/HorarioDoLembrete';
import { TEXTOS } from '@/textos';
import { BotaoPrincipal } from '../componentes/BotaoPrincipal';
import { BotaoVoltar } from '../componentes/BotaoVoltar';
import { Cartao } from '../componentes/Cartao';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { useAplicativo } from '../contextos/ContextoDoAplicativo';
import { descreverJanela, formatarHorario } from '../lembretes/textosDosLembretes';
import { ALVO_DE_TOQUE, CORES, ESPACO, FONTES, RAIO, TEXTO } from '../tema';

/** De meia em meia hora: a janela tem resolução de minuto, mas ninguém escolhe lembrete minuto a minuto. */
export const PASSO_EM_MINUTOS = 30;

type Limite = 'inicio' | 'fim';

const ROTULOS: Record<Limite, string> = { inicio: TEXTOS.lembretes.comeca, fim: TEXTOS.lembretes.vaiAte };

/**
 * A janela de horários em que o app pode avisar (#54). Cada ajuste é gravado na hora: quem sai da tela pelo
 * botão de voltar ou fechando o app não perde a escolha, e não há estado "salvo pela metade" para explicar.
 */
export function TelaHorarioDosLembretes() {
  const { container } = useAplicativo();
  const margens = useSafeAreaInsets();
  // null enquanto a preferência gravada não chegou: mostrar o padrão antes disso faria a tela piscar de 8h
  // para o horário da pessoa.
  const [janela, definirJanela] = useState<JanelaDeLembretes | null>(null);
  const [falhaAoLer, definirFalhaAoLer] = useState(false);
  const [falhaAoGravar, definirFalhaAoGravar] = useState(false);
  const gravacoes = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let atual = true;
    container.ajustarPreferencias.obterJanelaDeLembretes().then(
      (lida) => atual && definirJanela(lida),
      () => {
        if (!atual) return;
        definirJanela(JANELA_PADRAO);
        definirFalhaAoLer(true);
      },
    );
    return () => {
      atual = false;
    };
  }, [container]);

  function trocar(nova: JanelaDeLembretes) {
    definirJanela(nova);
    definirFalhaAoGravar(false);
    // Uma fila só: tocando rápido no mesmo botão, as gravações saem na ordem dos toques e a última é a que
    // fica. Em paralelo, a resposta mais lenta poderia sobrescrever a escolha mais recente.
    gravacoes.current = gravacoes.current
      .then(() => container.ajustarPreferencias.definirJanelaDeLembretes(nova))
      .catch(() => definirFalhaAoGravar(true));
  }

  function deslocar(limite: Limite, minutos: number) {
    if (janela === null) return;
    trocar({ ...janela, [limite]: deslocarHorario(janela[limite], minutos) });
  }

  return (
    <FundoAconchegante style={{ paddingTop: margens.top + ESPACO.pequeno }}>
      <View style={estilos.topo}>
        <BotaoVoltar />
      </View>
      <ScrollView
        contentContainerStyle={[estilos.conteudo, { paddingBottom: margens.bottom + ESPACO.folgado }]}
        scrollIndicatorInsets={{ bottom: margens.bottom }}
      >
        <Text style={TEXTO.titulo} accessibilityRole="header">
          {TEXTOS.lembretes.tituloDaTela}
        </Text>
        <Text style={TEXTO.corpo}>
          {TEXTOS.lembretes.explicacao}
        </Text>

        {janela === null ? (
          <Text style={TEXTO.corpo} accessibilityLiveRegion="polite">
            {TEXTOS.lembretes.lendo}
          </Text>
        ) : (
          <>
            {falhaAoLer ? (
              <Text style={estilos.alerta} accessibilityRole="alert">
                {TEXTOS.lembretes.falhaAoLer}
              </Text>
            ) : null}

            <Cartao>
              {(['inicio', 'fim'] as const).map((limite) => (
                <LinhaDoLimite
                  key={limite}
                  limite={limite}
                  horario={janela[limite]}
                  aoDeslocar={(minutos) => deslocar(limite, minutos)}
                />
              ))}
              <Text style={estilos.resumo} accessibilityLiveRegion="polite">
                {TEXTOS.lembretes.quandoChegam(descreverJanela(janela))}
              </Text>
            </Cartao>

            {falhaAoGravar ? (
              <Text style={estilos.alerta} accessibilityRole="alert">
                {TEXTOS.lembretes.falhaAoGuardar}
              </Text>
            ) : null}

            {janelasIguais(janela, JANELA_PADRAO) ? null : (
              <BotaoPrincipal
                titulo={TEXTOS.lembretes.voltarAoPadrao}
                variante="secundaria"
                largo
                aoTocar={() => trocar(JANELA_PADRAO)}
              />
            )}
          </>
        )}
      </ScrollView>
    </FundoAconchegante>
  );
}

function LinhaDoLimite({
  limite,
  horario,
  aoDeslocar,
}: {
  limite: Limite;
  horario: HorarioDoDia;
  aoDeslocar(minutos: number): void;
}) {
  const nome = limite === 'inicio' ? TEXTOS.lembretes.inicio : TEXTOS.lembretes.fim;
  return (
    <View style={estilos.linha}>
      <View style={estilos.textosDaLinha}>
        <Text style={estilos.rotuloDaLinha}>{ROTULOS[limite]}</Text>
        <Text style={estilos.horario} accessibilityLabel={`${ROTULOS[limite]} ${formatarHorario(horario)}`}>
          {formatarHorario(horario)}
        </Text>
      </View>
      <View style={estilos.passos}>
        <BotaoDePasso rotulo={TEXTOS.lembretes.adiantar(nome)} sinal="−" aoTocar={() => aoDeslocar(-PASSO_EM_MINUTOS)} />
        <BotaoDePasso rotulo={TEXTOS.lembretes.atrasar(nome)} sinal="+" aoTocar={() => aoDeslocar(PASSO_EM_MINUTOS)} />
      </View>
    </View>
  );
}

function BotaoDePasso({
  rotulo,
  sinal,
  aoTocar,
}: {
  rotulo: string;
  sinal: string;
  aoTocar(): void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityHint={TEXTOS.lembretes.passo(PASSO_EM_MINUTOS)}
      onPress={aoTocar}
      style={({ pressed }) => [estilos.passo, pressed && estilos.pressionado]}
    >
      <Text style={estilos.sinalDoPasso}>{sinal}</Text>
    </Pressable>
  );
}

/** Horário tem só hora e minuto, então comparar os quatro números basta. */
function janelasIguais(primeira: JanelaDeLembretes, segunda: JanelaDeLembretes): boolean {
  return (
    primeira.inicio.hora === segunda.inicio.hora &&
    primeira.inicio.minuto === segunda.inicio.minuto &&
    primeira.fim.hora === segunda.fim.hora &&
    primeira.fim.minuto === segunda.fim.minuto
  );
}

const estilos = StyleSheet.create({
  topo: { paddingHorizontal: ESPACO.grande },
  conteudo: { paddingHorizontal: ESPACO.grande, paddingTop: ESPACO.grande, gap: ESPACO.grande },
  linha: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.medio },
  textosDaLinha: { flex: 1, gap: ESPACO.fino },
  rotuloDaLinha: { ...TEXTO.rotulo, textTransform: 'uppercase' },
  horario: { fontFamily: FONTES.titulo, fontSize: 30, lineHeight: 34, color: CORES.texto },
  passos: { flexDirection: 'row', gap: ESPACO.pequeno },
  passo: {
    width: ALVO_DE_TOQUE,
    height: ALVO_DE_TOQUE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CORES.bordaSuave,
    borderRadius: RAIO.medio,
    backgroundColor: CORES.fundoTopo,
  },
  pressionado: { opacity: 0.78 },
  sinalDoPasso: { fontFamily: FONTES.forte, fontSize: 20, lineHeight: 24, color: CORES.acao },
  resumo: { ...TEXTO.corpo, color: CORES.texto },
  alerta: { ...TEXTO.corpo, color: CORES.erro },
});

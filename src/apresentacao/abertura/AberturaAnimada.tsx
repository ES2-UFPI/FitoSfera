import { useEffect, useRef, useState } from 'react';
import { Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import { FundoAconchegante } from '../componentes/FundoAconchegante';
import { CORES_DA_LOGO } from '../ilustracao/paletas';
import { FONTES, TEXTO } from '../tema/tipografia';
import {
  BASE,
  BOTAO,
  CAULE_CENTRAL,
  CAULES_LATERAIS,
  caminhoDeCubicas,
  caminhoDeLinha,
  comprimentoDeCubicas,
  comprimentoDeLinha,
  CURVAS_DA_FOLHA,
  FOLHA_DIREITA,
  FOLHA_ESQUERDA,
  GOTA,
  NERVURA,
  Ponto,
  RAIOS_DOS_PONTOS,
  SOL,
  TRILHAS,
} from './geometriaDaLogo';

/** A animação inteira, com um respiro no fim para o nome ser lido antes de a tela sumir. */
export const DURACAO_DA_ABERTURA_MS = 2900;

const TAMANHO_DA_LOGO = 220;
const ESCALA = TAMANHO_DA_LOGO / 200;

type Curva = (x: number) => number;
const SUAVE: Curva = Easing.bezier(0.65, 0, 0.35, 1);
const SALTO: Curva = Easing.bezier(0.34, 1.56, 0.64, 1);
const GIRO: Curva = Easing.bezier(0.34, 1.4, 0.64, 1);
const QUEDA: Curva = Easing.in(Easing.quad);
const CHEGADA: Curva = Easing.out(Easing.cubic);

/** Linha do tempo, em ms: [início, duração]. */
const TEMPOS = {
  base: [0, 600],
  cauleCentral: [200, 650],
  caulesLaterais: [350, 600],
  botao: [800, 350],
  contornoDasFolhas: [650, 750],
  nervuras: [1050, 400],
  trilhas: [1300, 400],
  pontinhos: [1600, 350],
  sol: [1350, 850],
  quedaDaGota: [1550, 410],
  nome: [2000, 600],
} as const;

/**
 * A logo se desenha: caules, folhas, circuitos, pontinhos, sol girando, gota quicando e o nome.
 * Um único relógio em JavaScript move tudo, para a animação ser igual no Android e na prévia web.
 */
export function AberturaAnimada({ aoTerminar }: { aoTerminar: () => void }) {
  const tempo = useTempoDecorrido(DURACAO_DA_ABERTURA_MS);
  const aoTerminarAtual = useRef(aoTerminar);
  aoTerminarAtual.current = aoTerminar;

  useEffect(() => {
    const temporizador = setTimeout(() => aoTerminarAtual.current(), DURACAO_DA_ABERTURA_MS);
    return () => clearTimeout(temporizador);
  }, []);

  const em = ([inicio, duracao]: readonly [number, number], curva: Curva = SUAVE) =>
    curva(Math.min(1, Math.max(0, (tempo - inicio) / duracao)));

  return (
    <FundoAconchegante style={estilos.tela}>
      <View style={estilos.logo}>
        <Svg width={TAMANHO_DA_LOGO} height={TAMANHO_DA_LOGO} viewBox="0 0 200 200">
          <Traco
            d={caminhoDeCubicas([BASE])}
            comprimento={comprimentoDeCubicas([BASE])}
            progresso={em(TEMPOS.base)}
            espessura={7}
          />
          <Traco
            d={caminhoDeLinha(CAULE_CENTRAL)}
            comprimento={comprimentoDeLinha(CAULE_CENTRAL)}
            progresso={em(TEMPOS.cauleCentral)}
          />
          {CAULES_LATERAIS.map((caule, i) => (
            <Traco
              key={i}
              d={caminhoDeLinha(caule)}
              comprimento={comprimentoDeLinha(caule)}
              progresso={em(TEMPOS.caulesLaterais)}
            />
          ))}
          <PontoQueAcende
            centro={BOTAO.centro}
            raio={BOTAO.raio}
            escala={em(TEMPOS.botao, SALTO)}
            cor={CORES_DA_LOGO.verde}
          />
          {[FOLHA_DIREITA, FOLHA_ESQUERDA].map((transform) => (
            <Folha
              key={transform}
              transform={transform}
              contorno={em(TEMPOS.contornoDasFolhas)}
              nervura={em(TEMPOS.nervuras)}
              trilhas={em(TEMPOS.trilhas)}
              pontinhos={em(TEMPOS.pontinhos, SALTO)}
            />
          ))}
        </Svg>
        <Sol progresso={em(TEMPOS.sol, GIRO)} />
        <Gota tempo={tempo} />
      </View>
      <Nome progresso={em(TEMPOS.nome, CHEGADA)} />
    </FundoAconchegante>
  );
}

/** Milissegundos desde a montagem, atualizados a cada quadro até `limite`. */
function useTempoDecorrido(limite: number): number {
  const [tempo, definirTempo] = useState(0);
  useEffect(() => {
    const inicio = Date.now();
    let quadro = 0;
    const avancar = () => {
      const decorrido = Date.now() - inicio;
      definirTempo(Math.min(decorrido, limite));
      if (decorrido < limite) quadro = requestAnimationFrame(avancar);
    };
    quadro = requestAnimationFrame(avancar);
    return () => cancelAnimationFrame(quadro);
  }, [limite]);
  return tempo;
}

interface PropsDoTraco {
  d: string;
  comprimento: number;
  progresso: number;
  cor?: string;
  espessura?: number;
}

/** Um traço que se desenha do começo ao fim, escondendo-se atrás do próprio tracejado. */
function Traco({ d, comprimento, progresso, cor = CORES_DA_LOGO.verde, espessura = 5 }: PropsDoTraco) {
  if (progresso <= 0) return null;
  // A folga de uma espessura esconde a ponta arredondada antes de o traço começar.
  const escondido = comprimento + espessura;
  return (
    <Path
      d={d}
      fill="none"
      stroke={cor}
      strokeWidth={espessura}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={`${escondido} ${escondido}`}
      strokeDashoffset={escondido * (1 - progresso)}
    />
  );
}

function PontoQueAcende({ centro, raio, escala, cor }: { centro: Ponto; raio: number; escala: number; cor: string }) {
  if (escala <= 0) return null;
  return <Circle cx={centro[0]} cy={centro[1]} r={raio * escala} fill={cor} />;
}

interface PropsDaFolha {
  transform: string;
  contorno: number;
  nervura: number;
  trilhas: number;
  pontinhos: number;
}

function Folha({ transform, contorno, nervura, trilhas, pontinhos }: PropsDaFolha) {
  return (
    <G transform={transform}>
      <Traco
        d={`${caminhoDeCubicas(CURVAS_DA_FOLHA)} Z`}
        comprimento={comprimentoDeCubicas(CURVAS_DA_FOLHA)}
        progresso={contorno}
      />
      <Traco d={caminhoDeLinha(NERVURA)} comprimento={comprimentoDeLinha(NERVURA)} progresso={nervura} />
      {TRILHAS.map((trilha, i) => (
        <Traco
          key={`trilha-${i}`}
          d={caminhoDeLinha(trilha)}
          comprimento={comprimentoDeLinha(trilha)}
          progresso={trilhas}
          cor={CORES_DA_LOGO.circuito}
          espessura={2.6}
        />
      ))}
      {TRILHAS.map((trilha, i) => (
        <PontoQueAcende
          key={`ponto-${i}`}
          centro={trilha[trilha.length - 1]}
          raio={RAIOS_DOS_PONTOS[i]}
          escala={pontinhos}
          cor={CORES_DA_LOGO.circuito}
        />
      ))}
    </G>
  );
}

const MEIA_CAIXA_DO_SOL = 35;
const ANGULOS_DOS_RAIOS = [0, 45, 90, 135, 180, 225, 270, 315];

function Sol({ progresso }: { progresso: number }) {
  const tamanho = MEIA_CAIXA_DO_SOL * 2 * ESCALA;
  const [de, ate] = SOL.raioDosRaios;
  return (
    <View
      style={[
        estilos.camada,
        {
          left: (SOL.centro[0] - MEIA_CAIXA_DO_SOL) * ESCALA,
          top: (SOL.centro[1] - MEIA_CAIXA_DO_SOL) * ESCALA,
          width: tamanho,
          height: tamanho,
          opacity: Math.min(1, Math.max(0, progresso * 1.5)),
          transform: [{ rotate: `${-120 * (1 - progresso)}deg` }, { scale: Math.max(0, progresso) }],
        },
      ]}
    >
      <Svg width={tamanho} height={tamanho} viewBox={`${-MEIA_CAIXA_DO_SOL} ${-MEIA_CAIXA_DO_SOL} 70 70`}>
        <Circle r={SOL.raio} fill={CORES_DA_LOGO.sol} />
        {ANGULOS_DOS_RAIOS.map((angulo) => {
          const rad = (angulo * Math.PI) / 180;
          return (
            <Line
              key={angulo}
              x1={Math.sin(rad) * de}
              y1={-Math.cos(rad) * de}
              x2={Math.sin(rad) * ate}
              y2={-Math.cos(rad) * ate}
              stroke={CORES_DA_LOGO.sol}
              strokeWidth={5}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    </View>
  );
}

/** Interpola entre quadros-chave [tempo, valor], parado antes do primeiro e depois do último. */
function entreQuadros(tempo: number, quadros: readonly (readonly [number, number])[]): number {
  if (tempo <= quadros[0][0]) return quadros[0][1];
  for (let i = 1; i < quadros.length; i++) {
    const [t0, v0] = quadros[i - 1];
    const [t1, v1] = quadros[i];
    if (tempo <= t1) return v0 + ((v1 - v0) * (tempo - t0)) / (t1 - t0);
  }
  return quadros[quadros.length - 1][1];
}

function Gota({ tempo }: { tempo: number }) {
  const [inicio, quedaMs] = TEMPOS.quedaDaGota;
  const pouso = inicio + quedaMs;
  const queda = QUEDA(Math.min(1, Math.max(0, (tempo - inicio) / quedaMs)));
  // Ao pousar, a gota achata, estica um pouco e volta ao formato.
  const largura = entreQuadros(tempo, [
    [pouso, 1],
    [pouso + 110, 1.18],
    [pouso + 220, 0.94],
    [pouso + 340, 1],
  ]);
  const altura = entreQuadros(tempo, [
    [pouso, 1],
    [pouso + 110, 0.78],
    [pouso + 220, 1.06],
    [pouso + 340, 1],
  ]);
  const opacidade = entreQuadros(tempo, [
    [inicio, 0],
    [inicio + 150, 1],
  ]);

  return (
    <View
      style={[
        estilos.camada,
        estilos.origemNaBase,
        {
          left: (GOTA.centro[0] - 25) * ESCALA,
          top: (GOTA.centro[1] - 32) * ESCALA,
          width: 50 * ESCALA,
          height: 64 * ESCALA,
          opacity: opacidade,
          transform: [{ translateY: -120 * ESCALA * (1 - queda) }, { scaleX: largura }, { scaleY: altura }],
        },
      ]}
    >
      <Svg width={50 * ESCALA} height={64 * ESCALA} viewBox="-25 -32 50 64">
        <Path d={GOTA.contorno} fill={CORES_DA_LOGO.gota} />
        <Path d={GOTA.brilho} fill="none" stroke={CORES_DA_LOGO.brilho} strokeWidth={4} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

function Nome({ progresso }: { progresso: number }) {
  return (
    <Text style={[estilos.nome, { opacity: progresso, transform: [{ translateY: 10 * (1 - progresso) }] }]}>
      FitoSfera
    </Text>
  );
}

const estilos = StyleSheet.create({
  tela: { alignItems: 'center', justifyContent: 'center' },
  logo: { width: TAMANHO_DA_LOGO, height: TAMANHO_DA_LOGO },
  camada: { position: 'absolute' },
  origemNaBase: { transformOrigin: '50% 100%' },
  nome: { ...TEXTO.titulo, fontFamily: FONTES.titulo, fontSize: 36, lineHeight: 44, marginTop: 28 },
});

import { StyleSheet, Text, View } from 'react-native';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { TEXTOS } from '@/textos';
import { CORES, ESPACO, FONTES, TEXTO } from '../tema';
import { CORES_DA_LOGO, CORES_DOS_DESTAQUES } from '../ilustracao/paletas';
import { Cartao } from './Cartao';
import { cuidadosDaEspecie, IconeDoCuidado } from './cuidadosDaEspecie';
import { IconeRegador } from './IconeRegador';
import { IconeLuz, IconeTemperatura } from './IconesDasCondicoes';
import { SeloDeDificuldade } from './SeloDeDificuldade';
import { APRESENTACAO_DA_DIFICULDADE, observacaoDaDificuldade } from './textosDaDificuldade';

const TAMANHO_DO_ICONE = 20;

function Icone({ tipo }: { tipo: IconeDoCuidado }) {
  if (tipo === 'rega') return <IconeRegador cor={CORES_DA_LOGO.gota} tamanho={TAMANHO_DO_ICONE} />;
  if (tipo === 'luz') return <IconeLuz cor={CORES_DA_LOGO.sol} tamanho={TAMANHO_DO_ICONE} />;
  return <IconeTemperatura cor={CORES_DOS_DESTAQUES.laranja.cor} tamanho={TAMANHO_DO_ICONE} />;
}

/**
 * Os cuidados do dia a dia da espécie (rega, sol e temperatura), o nível de dificuldade e o que pesou nele.
 *
 * Diferente da lista do cadastro, aqui a espécie fácil também diz algo: numa lista de 33 linhas uma observação
 * em toda espécie seria ruído, mas quem abriu a própria planta quer ler que ela é tranquila.
 */
export function CartaoDaDificuldade({ especie }: { especie: EspecieVegetal | null }) {
  // Espécie que saiu do catálogo não tem nível para mostrar.
  if (especie === null) return null;
  const dificuldade = APRESENTACAO_DA_DIFICULDADE[especie.nivelDeDificuldade];
  const cuidados = cuidadosDaEspecie(especie);
  const observacao = observacaoDaDificuldade(especie.nivelDeDificuldade, {
    ...especie,
    exigencias: especie.exigencias ?? null,
  });

  return (
    // O fundo e a borda vêm do nível, em `APRESENTACAO_DA_DIFICULDADE`; o resto é o cartão de sempre.
    <Cartao testID="cartao-dificuldade" estilo={{ backgroundColor: dificuldade.fundo, borderColor: dificuldade.borda }}>
      <View style={estilos.cabecalho}>
        <Text style={TEXTO.subtitulo} accessibilityRole="header">
          {TEXTOS.detalhe.cuidadosDaEspecie}
        </Text>
        <SeloDeDificuldade nivel={especie.nivelDeDificuldade} sobreFundoTingido />
      </View>

      <View style={estilos.cuidados} accessible accessibilityLabel={cuidados.falado}>
        {cuidados.itens.map((item) => (
          <View key={item.icone} style={estilos.cuidado}>
            <View style={estilos.icone}>
              <Icone tipo={item.icone} />
            </View>
            <Text style={estilos.textoDoMotivo}>{item.texto}</Text>
          </View>
        ))}
      </View>

      {observacao === null ? (
        <Text style={estilos.textoDoMotivo}>{dificuldade.falado}</Text>
      ) : (
        // Um só elemento acessível: o leitor de tela fala a frase inteira, sem anunciar marcador a cada linha.
        <View style={estilos.motivos} accessible accessibilityLabel={observacao.falado}>
          {especie.nivelDeDificuldade !== 'facil' ? (
            <Text style={[TEXTO.rotulo, estilos.porQue]}>{TEXTOS.cuidados.porQue[especie.nivelDeDificuldade]}</Text>
          ) : null}
          {observacao.itens.map((motivo) => (
            <View key={motivo} style={estilos.motivo}>
              <Text style={estilos.marcador}>•</Text>
              <Text testID="motivo-da-dificuldade" style={estilos.textoDoMotivo}>
                {motivo}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ESPACO.pequeno },
  cuidados: { gap: ESPACO.pequeno },
  cuidado: { flexDirection: 'row', alignItems: 'center', gap: ESPACO.pequeno },
  icone: { width: 24, alignItems: 'center' },
  motivos: { gap: ESPACO.minimo },
  porQue: { color: CORES.texto, marginTop: ESPACO.pequeno },
  motivo: { flexDirection: 'row', gap: ESPACO.pequeno },
  /** `texto`, e não `textoApoio`: sobre os fundos tingidos o apoio fica abaixo de 4,5:1 em 14 px. */
  marcador: { fontFamily: FONTES.texto, fontSize: 14, lineHeight: 21, color: CORES.texto },
  /** O `flex: 1` deixa a linha que quebra alinhada com o texto, e não embaixo do marcador. */
  textoDoMotivo: { flex: 1, fontFamily: FONTES.texto, fontSize: 14, lineHeight: 21, color: CORES.texto },
});

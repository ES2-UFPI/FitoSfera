import { StyleSheet, Text, View } from 'react-native';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { TEXTOS } from '@/textos';
import { CORES, ESPACO, FONTES, TEXTO } from '../tema';
import { Cartao } from './Cartao';
import { SeloDeDificuldade } from './SeloDeDificuldade';
import { APRESENTACAO_DA_DIFICULDADE, observacaoDaDificuldade } from './textosDaDificuldade';

/**
 * O nível de dificuldade da espécie da planta, e o que pesou nele.
 *
 * Diferente da lista do cadastro, aqui a espécie fácil também diz algo: numa lista de 33 linhas uma observação
 * em toda espécie seria ruído, mas quem abriu a própria planta quer ler que ela é tranquila.
 */
export function CartaoDaDificuldade({ especie }: { especie: EspecieVegetal | null }) {
  // Espécie que saiu do catálogo não tem nível para mostrar.
  if (especie === null) return null;
  const dificuldade = APRESENTACAO_DA_DIFICULDADE[especie.nivelDeDificuldade];
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

      {observacao === null ? (
        <Text style={estilos.textoDoMotivo}>{dificuldade.falado}</Text>
      ) : (
        // Um só elemento acessível: o leitor de tela fala a frase inteira, sem anunciar marcador a cada linha.
        <View style={estilos.motivos} accessible accessibilityLabel={observacao.falado}>
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
  motivos: { gap: ESPACO.minimo },
  motivo: { flexDirection: 'row', gap: ESPACO.pequeno },
  /** `texto`, e não `textoApoio`: sobre os fundos tingidos o apoio fica abaixo de 4,5:1 em 14 px. */
  marcador: { fontFamily: FONTES.texto, fontSize: 14, lineHeight: 21, color: CORES.texto },
  /** O `flex: 1` deixa a linha que quebra alinhada com o texto, e não embaixo do marcador. */
  textoDoMotivo: { flex: 1, fontFamily: FONTES.texto, fontSize: 14, lineHeight: 21, color: CORES.texto },
});

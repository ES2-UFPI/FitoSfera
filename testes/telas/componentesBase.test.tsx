import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text, ViewStyle } from 'react-native';
import { Cartao } from '@/apresentacao/componentes/Cartao';
import { MensagemDeVazio } from '@/apresentacao/componentes/MensagemDeVazio';
import { SeloDeStatus } from '@/apresentacao/componentes/SeloDeStatus';
import { CORES, ESPACO, LARGURA_DO_CONTEUDO, RAIO } from '@/apresentacao/tema';
import { plantaDeTeste } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

const estilo = (elemento: { props: { style?: unknown } }) =>
  (StyleSheet.flatten(elemento.props.style as ViewStyle) ?? {}) as ViewStyle;

describe('Cartao', () => {
  test('tem a base de todos os cartões: superfície, borda fina, raio e espaços dos tokens', () => {
    render(
      <Cartao testID="cartao">
        <Text>conteúdo</Text>
      </Cartao>,
    );

    expect(estilo(screen.getByTestId('cartao'))).toMatchObject({
      maxWidth: LARGURA_DO_CONTEUDO,
      padding: ESPACO.grande,
      gap: ESPACO.medio,
      borderRadius: RAIO.medio,
      borderWidth: 1,
      borderColor: CORES.bordaSuave,
      backgroundColor: CORES.superficie,
    });
  });

  test('compacto tira o espaço interno, para o cartão que monta o próprio cabeçalho', () => {
    render(
      <Cartao testID="cartao" compacto>
        <Text>conteúdo</Text>
      </Cartao>,
    );
    expect(estilo(screen.getByTestId('cartao'))).toMatchObject({ padding: 0, gap: 0, borderRadius: RAIO.medio });
  });

  test('o estilo extra acrescenta uma cor sem mudar a base', () => {
    render(
      <Cartao testID="cartao" estilo={{ backgroundColor: CORES.fundoAtencao }}>
        <Text>conteúdo</Text>
      </Cartao>,
    );
    expect(estilo(screen.getByTestId('cartao'))).toMatchObject({
      backgroundColor: CORES.fundoAtencao,
      padding: ESPACO.grande,
    });
  });
});

describe('SeloDeStatus', () => {
  test('a pílula mostra o status por texto, não só pela cor, e o leitor de tela o anuncia', () => {
    render(<SeloDeStatus status="atencao" />);

    expect(screen.getByText('Precisa de atenção')).toBeTruthy();
    expect(screen.getByLabelText('Status: Precisa de atenção.')).toBeTruthy();
  });

  test('o miúdo, da etiqueta da estante, usa o texto curto', () => {
    render(<SeloDeStatus status="sem-dados" forma="miudo" />);
    expect(screen.getByText('sem dados')).toBeTruthy();
  });
});

describe('MensagemDeVazio', () => {
  test('na tela, o título é um cabeçalho e o desenho fica escondido do leitor de tela', () => {
    render(<MensagemDeVazio forma="tela" titulo="Nada aqui" texto="Volte depois." icone={<Text>ícone</Text>} />);

    expect(screen.getByRole('header', { name: 'Nada aqui' })).toBeTruthy();
    expect(screen.getByText('Volte depois.')).toBeTruthy();
    expect(screen.queryByText('ícone')).toBeNull();
  });

  test('no cartão, título e texto são lidos juntos, como uma frase só', () => {
    render(<MensagemDeVazio titulo="Nada aqui" texto="Volte depois." testID="vazio" />);
    expect(screen.getByTestId('vazio')).toHaveProp('accessible', true);
  });
});

test('todos os cartões da tela da planta usam a mesma base, sem raio ou espaço próprios', async () => {
  renderizarApp({ plantas: [plantaDeTeste({ id: 'p1', idEspecie: 'tomate' })], url: '/planta/p1' });
  await screen.findByRole('header', { name: 'Registrar colheita' });

  // Os cartões são as Views com a borda fina da superfície e espaço interno: painel, luz, rega, colheitas…
  const cartoes = screen.root
    .findAll((no) => String(no.type) === 'View' && estilo(no).borderWidth === 1 && estilo(no).backgroundColor === CORES.superficie)
    .map(estilo)
    .filter((estiloDoCartao) => estiloDoCartao.padding === ESPACO.grande);

  expect(cartoes.length).toBeGreaterThanOrEqual(4);
  for (const estiloDoCartao of cartoes) {
    expect(estiloDoCartao).toMatchObject({ borderRadius: RAIO.medio, gap: ESPACO.medio });
  }
});

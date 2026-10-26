import { Desvio, GRANDEZAS, SentidoDoDesvio } from '@/dominio/regras/DesvioDaLeitura';
import { Acao, acaoDoDesvio, acaoPrincipal, montarMensagemDoAviso } from '@/dominio/servicos/MensagemDoAviso';

const desvio = (grandeza: Desvio['grandeza'], sentido: SentidoDoDesvio, valor: number): Desvio => ({
  grandeza,
  sentido,
  valor,
  faixa: { minimo: 18, maximo: 28 },
});

const SECO = desvio('umidadeDoAr', 'abaixo', 30);
const ABAFADO = desvio('umidadeDoAr', 'acima', 92);
const FRIO = desvio('temperatura', 'abaixo', 9);
const CALOR = desvio('temperatura', 'acima', 31.25);
const SOMBRA = desvio('luminosidade', 'abaixo', 120);
const SOL_FORTE = desvio('luminosidade', 'acima', 90000);

describe('a ação de cada tipo de desvio', () => {
  const esperado: readonly { descricao: string; desvio: Desvio; acao: Acao }[] = [
    { descricao: 'umidade baixa', desvio: SECO, acao: 'aguar' },
    { descricao: 'umidade alta', desvio: ABAFADO, acao: 'reposicionar' },
    { descricao: 'frio', desvio: FRIO, acao: 'reposicionar' },
    { descricao: 'calor', desvio: CALOR, acao: 'afastar do sol' },
    { descricao: 'luz abaixo do ideal', desvio: SOMBRA, acao: 'reposicionar' },
    { descricao: 'luz acima do ideal', desvio: SOL_FORTE, acao: 'reposicionar' },
  ];

  for (const { descricao, desvio: desviado, acao } of esperado) {
    test(`${descricao} se resolve com "${acao}"`, () => {
      expect(acaoDoDesvio(desviado)).toBe(acao);
    });
  }

  test('os seis tipos de desvio possíveis estão cobertos acima', () => {
    const sentidos: readonly SentidoDoDesvio[] = ['abaixo', 'acima'];
    const todos = GRANDEZAS.flatMap((grandeza) => sentidos.map((sentido) => `${grandeza}:${sentido}`));
    const cobertos = esperado.map(({ desvio: item }) => `${item.grandeza}:${item.sentido}`);
    expect([...cobertos].sort()).toEqual([...todos].sort());
  });

  test('umidade baixa é o único desvio que pede água', () => {
    const pedemAgua = [SECO, ABAFADO, FRIO, CALOR, SOMBRA, SOL_FORTE].filter(
      (item) => acaoDoDesvio(item) === 'aguar',
    );
    expect(pedemAgua).toEqual([SECO]);
  });

  test('luz fora do ideal, dos dois lados, pede reposicionar', () => {
    expect(acaoDoDesvio(SOMBRA)).toBe('reposicionar');
    expect(acaoDoDesvio(SOL_FORTE)).toBe('reposicionar');
  });
});

describe('o título', () => {
  test('cita o apelido da planta e a ação necessária', () => {
    expect(montarMensagemDoAviso('Tomatinho', [SECO]).titulo).toBe('Tomatinho precisa de água');
    expect(montarMensagemDoAviso('Tomatinho', [CALOR]).titulo).toBe('Tomatinho precisa sair do sol');
    expect(montarMensagemDoAviso('Jiboia', [SOMBRA]).titulo).toBe('Jiboia precisa mudar de lugar');
  });

  test('não leva número, unidade nem limite nenhum', () => {
    for (const item of [SECO, ABAFADO, FRIO, CALOR, SOMBRA, SOL_FORTE]) {
      expect(montarMensagemDoAviso('Tomatinho', [item]).titulo).not.toMatch(/\d/);
    }
  });

  test('com vários desvios, pede a ação mais urgente: água antes de sombra', () => {
    expect(montarMensagemDoAviso('Tomatinho', [SECO, CALOR]).titulo).toBe('Tomatinho precisa de água');
    expect(montarMensagemDoAviso('Tomatinho', [CALOR, SECO]).titulo).toBe('Tomatinho precisa de água');
  });

  test('sombra e calor juntos pedem sair do sol, não mudar de lugar', () => {
    expect(montarMensagemDoAviso('Tomatinho', [CALOR, SOL_FORTE]).titulo).toBe('Tomatinho precisa sair do sol');
  });

  test('sem desvio nenhum, não inventa ação', () => {
    expect(montarMensagemDoAviso('Tomatinho', []).titulo).toBe('Tomatinho precisa de atenção');
    expect(acaoPrincipal([])).toBeNull();
  });
});

describe('o corpo', () => {
  test('diz de forma curta o valor medido e o lado em que saiu do ideal', () => {
    expect(montarMensagemDoAviso('Tomatinho', [CALOR]).corpo).toBe('A temperatura está em 31,3 °C, acima do ideal.');
  });

  test('a umidade usa o símbolo colado ao número', () => {
    expect(montarMensagemDoAviso('Jiboia', [SECO]).corpo).toBe('A umidade do ar está em 30%, abaixo do ideal.');
  });

  test('cada desvio vira uma frase, na ordem recebida', () => {
    expect(montarMensagemDoAviso('Jiboia', [SECO, CALOR]).corpo).toBe(
      'A umidade do ar está em 30%, abaixo do ideal. A temperatura está em 31,3 °C, acima do ideal.',
    );
  });

  test('sem desvio nenhum, fica vazio', () => {
    expect(montarMensagemDoAviso('Jiboia', []).corpo).toBe('');
  });
});

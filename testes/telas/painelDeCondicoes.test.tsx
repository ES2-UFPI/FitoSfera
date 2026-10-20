import { render, screen } from '@testing-library/react-native';
import { PainelDeCondicoes } from '@/apresentacao/componentes/PainelDeCondicoes';
import { CORES } from '@/apresentacao/tema/cores';

const leitura = {
  umidadePercentual: 58,
  temperaturaCelsius: 24.5,
  luminosidadeLux: 720,
  medidaEm: new Date(2026, 9, 17, 14, 5),
};

const faixasRecomendadas = {
  umidadePercentual: { minimo: 60, maximo: 80 },
  temperaturaCelsius: { minimo: 18.5, maximo: 26.5 },
  luminosidadeLux: { minimo: 500, maximo: 1000 },
};

test('mostra valores e faixas recomendadas com suas unidades', () => {
  render(
    <PainelDeCondicoes estado={{ tipo: 'leitura', leitura, faixasRecomendadas, demonstracao: true }} />,
  );

  expect(screen.getByRole('header', { name: 'Condições agora' })).toBeTruthy();
  expect(screen.getByText('DADOS DE DEMONSTRAÇÃO')).toBeTruthy();
  expect(screen.getByText('Última leitura às 14:05')).toBeTruthy();
  expect(screen.getByText('Ideal: 60–80%')).toBeTruthy();
  expect(screen.getByText('Ideal: 18,5–26,5 °C')).toBeTruthy();
  expect(screen.getByText('Ideal: 500–1000 lux')).toBeTruthy();
  expect(
    screen.getByLabelText('Umidade: 58 por cento. Faixa ideal: 60 a 80 por cento. Abaixo do ideal.'),
  ).toBeTruthy();
  expect(
    screen.getByLabelText(
      'Temperatura: 24,5 graus Celsius. Faixa ideal: 18,5 a 26,5 graus Celsius. Dentro do ideal.',
    ),
  ).toBeTruthy();
  expect(screen.getByLabelText('Luz: 720 lux. Faixa ideal: 500 a 1000 lux. Dentro do ideal.')).toBeTruthy();
  expect(screen.getByTestId('icone-umidade')).toBeTruthy();
  expect(screen.getByTestId('icone-temperatura')).toBeTruthy();
  expect(screen.getByTestId('icone-luz')).toBeTruthy();
});

test('leitura desatualizada mostra "sem dados" em vez dos valores antigos', () => {
  render(<PainelDeCondicoes estado={{ tipo: 'leitura', leitura, desatualizada: true }} />);

  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByText('Leitura desatualizada')).toBeTruthy();
  expect(screen.getByText('Última leitura às 14:05')).toBeTruthy();
  expect(screen.getAllByText('sem dados')).toHaveLength(3);
  expect(screen.queryByText('58')).toBeNull();
  expect(screen.queryByText('24,5')).toBeNull();
  expect(screen.queryByText('720')).toBeNull();
  expect(screen.getByLabelText(/^Umidade: sem dados recentes\./)).toBeTruthy();
  expect(screen.getByLabelText(/^Temperatura: sem dados recentes\./)).toBeTruthy();
  expect(screen.getByLabelText(/^Luz: sem dados recentes\./)).toBeTruthy();
});

test('mostra o estado de carregamento sem inventar valores', () => {
  render(<PainelDeCondicoes estado={{ tipo: 'carregando' }} />);

  expect(screen.getByText('Buscando as condições da planta…')).toBeTruthy();
  expect(screen.queryByText('UMIDADE')).toBeNull();
  expect(screen.queryByText(/Última leitura às/)).toBeNull();
});

test('explica quando o sensor está indisponível', () => {
  render(<PainelDeCondicoes estado={{ tipo: 'indisponivel' }} />);

  expect(screen.getByText('O sensor ainda não está disponível nesta versão.')).toBeTruthy();
  expect(screen.queryByText('DADOS DE DEMONSTRAÇÃO')).toBeNull();
});

test('sem leitura, mostra as faixas ideais da espécie sem inventar valores', () => {
  render(<PainelDeCondicoes estado={{ tipo: 'sem-leitura', faixasRecomendadas }} />);

  expect(screen.getByText('Nenhuma leitura disponível ainda.')).toBeTruthy();
  expect(screen.getByText('Ideal: 60–80%')).toBeTruthy();
  expect(screen.getByText('Ideal: 18,5–26,5 °C')).toBeTruthy();
  expect(screen.getByText('Ideal: 500–1000 lux')).toBeTruthy();
  expect(screen.getAllByText('sem dados')).toHaveLength(3);
  expect(
    screen.getByLabelText('Umidade: sem dados recentes. Faixa ideal: 60 a 80 por cento.'),
  ).toBeTruthy();
  expect(screen.queryByText(/do ideal$/)).toBeNull();
});

test('distingue a ausência de leituras de um sensor indisponível', () => {
  render(<PainelDeCondicoes estado={{ tipo: 'sem-leitura' }} />);

  expect(screen.getByText('Nenhuma leitura disponível ainda.')).toBeTruthy();
  expect(screen.queryByText('O sensor ainda não está disponível nesta versão.')).toBeNull();
  expect(screen.queryByText('UMIDADE')).toBeNull();
});

test('mantém a leitura visível enquanto uma atualização está em andamento', () => {
  render(<PainelDeCondicoes estado={{ tipo: 'leitura', leitura, atualizando: true }} />);

  expect(screen.getByText('Atualizando condições…')).toBeTruthy();
  expect(screen.getByLabelText(/^Umidade: 58 por cento\./)).toBeTruthy();
  expect(screen.getByLabelText(/^Temperatura: 24,5 graus Celsius\./)).toBeTruthy();
  expect(screen.getByLabelText(/^Luz: 720 lux\./)).toBeTruthy();
});

test('explica quando uma espécie não possui determinada faixa recomendada', () => {
  render(
    <PainelDeCondicoes
      estado={{
        tipo: 'leitura',
        leitura,
        faixasRecomendadas: {
          umidadePercentual: faixasRecomendadas.umidadePercentual,
          temperaturaCelsius: faixasRecomendadas.temperaturaCelsius,
        },
      }}
    />,
  );

  expect(screen.getAllByText('Faixa ideal não informada')).toHaveLength(1);
  expect(screen.getByLabelText('Luz: 720 lux. Faixa ideal não informada.')).toBeTruthy();
});

test('destaca com cor e texto os valores fora da faixa ideal', () => {
  render(
    <PainelDeCondicoes
      estado={{
        tipo: 'leitura',
        leitura: { ...leitura, umidadePercentual: 40, temperaturaCelsius: 30, luminosidadeLux: 720 },
        faixasRecomendadas,
      }}
    />,
  );

  expect(screen.getByText('▼ Abaixo do ideal')).toBeTruthy();
  expect(screen.getByText('▲ Acima do ideal')).toBeTruthy();
  expect(screen.getByText('✓ Dentro do ideal')).toBeTruthy();
  expect(screen.getByLabelText(/^Umidade: 40 por cento\..*Abaixo do ideal\.$/)).toHaveStyle({
    borderColor: CORES.statusAtencao,
    backgroundColor: CORES.fundoAtencao,
  });
  expect(screen.getByLabelText(/^Temperatura: 30 graus Celsius\..*Acima do ideal\.$/)).toHaveStyle({
    borderColor: CORES.statusAtencao,
  });
  expect(screen.getByLabelText(/^Luz: 720 lux\..*Dentro do ideal\.$/)).not.toHaveStyle({
    borderColor: CORES.statusAtencao,
  });
});

test('valor exatamente no limite da faixa conta como dentro do ideal', () => {
  render(
    <PainelDeCondicoes
      estado={{
        tipo: 'leitura',
        leitura: { ...leitura, umidadePercentual: 60, temperaturaCelsius: 26.5, luminosidadeLux: 500 },
        faixasRecomendadas,
      }}
    />,
  );

  expect(screen.getAllByText('✓ Dentro do ideal')).toHaveLength(3);
  expect(screen.queryByText(/Abaixo do ideal|Acima do ideal/)).toBeNull();
});

test('leitura desatualizada não é avaliada contra a faixa', () => {
  render(
    <PainelDeCondicoes
      estado={{
        tipo: 'leitura',
        leitura: { ...leitura, umidadePercentual: 40 },
        faixasRecomendadas,
        desatualizada: true,
      }}
    />,
  );

  expect(screen.queryByText(/do ideal$/)).toBeNull();
  expect(screen.getByLabelText('Umidade: sem dados recentes. Faixa ideal: 60 a 80 por cento.')).toBeTruthy();
  expect(screen.queryByText('40')).toBeNull();
});

test('sem faixa recomendada não indica situação', () => {
  render(<PainelDeCondicoes estado={{ tipo: 'leitura', leitura }} />);

  expect(screen.queryByText(/do ideal$/)).toBeNull();
});

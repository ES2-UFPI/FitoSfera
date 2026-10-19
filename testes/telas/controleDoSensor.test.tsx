import { fireEvent, screen } from 'expo-router/testing-library';
import {
  ConfiguracaoDoSensorDeDesenvolvimento,
  ControleDoSensorDeDesenvolvimento,
} from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { SensorSimulado } from '@/infraestrutura/sensores/SensorSimulado';
import { plantaDeTeste, RelogioParado } from '../apoio/fakes';
import { renderizarApp } from './apoio/renderizarApp';

class ControleFixo implements ControleDoSensorDeDesenvolvimento {
  constructor(
    private configuracao: ConfiguracaoDoSensorDeDesenvolvimento = {
      umidade: 'automatico',
      temperatura: 'automatico',
      luminosidade: 'automatico',
      desconectado: false,
    },
  ) {}

  obterConfiguracao() {
    return { ...this.configuracao };
  }

  definirConfiguracao(configuracao: ConfiguracaoDoSensorDeDesenvolvimento) {
    this.configuracao = { ...configuracao };
  }
}

test('mostra os cenários apenas quando há um sensor de desenvolvimento', async () => {
  renderizarApp({ url: '/ajustes', controleDoSensorDeDesenvolvimento: new ControleFixo() });

  expect(await screen.findByRole('header', { name: 'Ajustes' })).toBeTruthy();
  expect(screen.getByText('DADOS SIMULADOS')).toBeTruthy();
  expect(screen.getByText('O que significa automático?')).toBeTruthy();
  expect(
    screen.getByText(
      'A condição varia sozinha ao longo do dia seguindo um ciclo ambiental simulado. Você pode deixar uma grandeza automática e forçar apenas as outras.',
    ),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Tudo automático' }).props.accessibilityState.selected).toBe(true);
  expect(screen.getByRole('button', { name: 'Quente, seco e ensolarado' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Customizado' }).props.accessibilityState).toEqual({
    selected: false,
    disabled: true,
  });
  expect(screen.getByRole('button', { name: 'Umidade: Baixo' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Temperatura: Alto' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Luz: Alto' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Desconectado' })).toBeTruthy();
});

test('o atalho combina calor, tempo seco e sol alto', async () => {
  const controle = new ControleFixo();
  renderizarApp({ url: '/ajustes', controleDoSensorDeDesenvolvimento: controle });

  fireEvent.press(await screen.findByRole('button', { name: 'Quente, seco e ensolarado' }));

  expect(controle.obterConfiguracao()).toEqual({
    umidade: 'baixo',
    temperatura: 'alto',
    luminosidade: 'alto',
    desconectado: false,
  });
  expect(screen.getByRole('button', { name: 'Quente, seco e ensolarado' }).props.accessibilityState.selected).toBe(
    true,
  );
  expect(screen.getByText('Combinação atual: umidade baixa, temperatura alta e luz alta.')).toBeTruthy();
});

test('permite montar uma combinação personalizada', async () => {
  const controle = new ControleFixo();
  renderizarApp({ url: '/ajustes', controleDoSensorDeDesenvolvimento: controle });

  fireEvent.press(await screen.findByRole('button', { name: 'Umidade: Alto' }));
  fireEvent.press(screen.getByRole('button', { name: 'Temperatura: Baixo' }));
  fireEvent.press(screen.getByRole('button', { name: 'Luz: Alto' }));

  expect(controle.obterConfiguracao()).toEqual({
    umidade: 'alto',
    temperatura: 'baixo',
    luminosidade: 'alto',
    desconectado: false,
  });
  expect(screen.getByRole('button', { name: 'Customizado' }).props.accessibilityState).toEqual({
    selected: true,
    disabled: false,
  });
  expect(screen.getByText('Combinação atual: umidade alta, temperatura baixa e luz alta.')).toBeTruthy();
});

test('o painel exibe a leitura forçada pelo simulador sem hardware', async () => {
  const sensor = new SensorSimulado(new RelogioParado(new Date(2026, 9, 19, 14, 0)));
  sensor.definirConfiguracao({
    umidade: 'baixo',
    temperatura: 'automatico',
    luminosidade: 'automatico',
    desconectado: false,
  });
  renderizarApp({
    plantas: [plantaDeTeste()],
    url: '/planta/p1',
    sensor,
    controleDoSensorDeDesenvolvimento: sensor,
  });

  expect(await screen.findByLabelText('Umidade: 10 por cento. Faixa ideal: 40 a 70 por cento.')).toBeTruthy();
  expect(screen.queryByText('DADOS DE DEMONSTRAÇÃO')).toBeNull();
});

test('o cenário desconectado não é escondido por valores demonstrativos', async () => {
  const sensor = new SensorSimulado(new RelogioParado());
  sensor.definirConfiguracao({
    umidade: 'automatico',
    temperatura: 'automatico',
    luminosidade: 'automatico',
    desconectado: true,
  });
  renderizarApp({
    plantas: [plantaDeTeste()],
    url: '/planta/p1',
    sensor,
    controleDoSensorDeDesenvolvimento: sensor,
  });

  expect(await screen.findByText('Nenhuma leitura disponível ainda.')).toBeTruthy();
  expect(screen.queryByText('DADOS DE DEMONSTRAÇÃO')).toBeNull();
});

import { Desvio } from '@/dominio/regras/DesvioDaLeitura';
import { montarMensagemDoAviso } from '@/dominio/servicos/MensagemDoAviso';

const CALOR: Desvio = {
  grandeza: 'temperatura',
  sentido: 'acima',
  valor: 31.25,
  faixa: { minimo: 18, maximo: 28 },
};

const SECO: Desvio = {
  grandeza: 'umidadeDoAr',
  sentido: 'abaixo',
  valor: 30,
  faixa: { minimo: 40, maximo: 70 },
};

test('o título diz de qual planta é o aviso', () => {
  expect(montarMensagemDoAviso('Tomatinho', [CALOR]).titulo).toBe('Tomatinho precisa de atenção');
});

test('o corpo diz de forma curta o valor medido e o lado em que saiu do ideal', () => {
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

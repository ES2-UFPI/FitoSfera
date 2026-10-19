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

test('o corpo diz o valor medido, o lado em que saiu e a faixa ideal', () => {
  expect(montarMensagemDoAviso('Tomatinho', [CALOR]).corpo).toBe(
    'A temperatura está em 31,3 °C, acima da faixa ideal (18 °C a 28 °C).',
  );
});

test('a umidade usa o símbolo colado ao número', () => {
  expect(montarMensagemDoAviso('Jiboia', [SECO]).corpo).toBe(
    'A umidade do ar está em 30%, abaixo da faixa ideal (40% a 70%).',
  );
});

test('cada desvio vira uma frase, na ordem recebida', () => {
  expect(montarMensagemDoAviso('Jiboia', [SECO, CALOR]).corpo).toBe(
    'A umidade do ar está em 30%, abaixo da faixa ideal (40% a 70%). ' +
      'A temperatura está em 31,3 °C, acima da faixa ideal (18 °C a 28 °C).',
  );
});

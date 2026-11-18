import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { sugerirAparencia } from '@/dominio/regras/AparenciaSugerida';

const frutifera = (id: string) => ({ id, frutifera: true });

test('cada frutífera conhecida começa com uma forma e uma cor próprias', () => {
  expect(sugerirAparencia(frutifera('morango'), APARENCIA_INICIAL)).toMatchObject({ forma: 'rasteira', destaque: 'vermelho' });
  expect(sugerirAparencia(frutifera('abobrinha'), APARENCIA_INICIAL)).toMatchObject({ forma: 'rasteira', destaque: 'amarelo' });
  expect(sugerirAparencia(frutifera('pimentao'), APARENCIA_INICIAL)).toMatchObject({ forma: 'frutifera', destaque: 'laranja' });
});

test('frutífera sem sugestão própria usa a forma Frutífera com frutos vermelhos', () => {
  expect(sugerirAparencia(frutifera('tomate'), APARENCIA_INICIAL)).toMatchObject({ forma: 'frutifera', destaque: 'vermelho' });
});

test('planta sem frutos volta para a forma inicial', () => {
  const rasteira = { ...APARENCIA_INICIAL, forma: 'rasteira' } as const;
  expect(sugerirAparencia({ id: 'lavanda', frutifera: false }, rasteira).forma).toBe(APARENCIA_INICIAL.forma);
});

test('a folhagem e o vaso já escolhidos ficam como estavam', () => {
  const escolhida = { ...APARENCIA_INICIAL, folhagem: 'roxo', vaso: 'azul' } as const;
  expect(sugerirAparencia(frutifera('morango'), escolhida)).toMatchObject({ folhagem: 'roxo', vaso: 'azul' });
});

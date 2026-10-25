import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { ID_JARDIM_PRINCIPAL, Planta } from '@/dominio/modelos/Planta';
import { deRegistro, paraRegistro } from '@/infraestrutura/persistencia/MapeadorDePlanta';
import { FAIXAS_DE_TESTE } from '../apoio/especiesDeTeste';

test('ida e volta preserva todos os campos', () => {
  const planta = Planta.criar({
    id: 'p1',
    idJardim: 'varanda',
    idEspecie: 'tomate',
    apelido: 'Tom',
    aparencia: { forma: 'frutifera', folhagem: 'roxo', destaque: 'amarelo', vaso: 'azul' },
    cadastradaEm: new Date('2026-10-17T14:00:00.000Z'),
    faixasRecomendadas: FAIXAS_DE_TESTE,
    intervaloDeRegaEmDias: 3,
  });
  expect(deRegistro(JSON.parse(JSON.stringify(paraRegistro(planta))))).toEqual(planta);
});

test.each([
  ['ausente', undefined],
  ['nulo', null],
  ['zero', 0],
  ['negativo', -3],
  ['fracionado', 2.5],
  ['em texto', '3'],
])('intervalo de rega %s deixa a planta sem intervalo, sem perder o registro', (_, intervalo) => {
  const planta = deRegistro({ id: 'p1', idEspecie: 'tomate', apelido: 'Tom', intervaloDeRegaEmDias: intervalo });
  expect(planta?.apelido).toBe('Tom');
  expect(planta?.intervaloDeRegaEmDias).toBeNull();
});

test('o intervalo gravado é lido de volta', () => {
  const planta = deRegistro({ id: 'p1', idEspecie: 'tomate', apelido: 'Tom', intervaloDeRegaEmDias: 7 });
  expect(planta?.intervaloDeRegaEmDias).toBe(7);
});

test.each([
  ['ausentes', undefined],
  ['nulas', null],
  ['sem uma das grandezas', { umidadeDoAr: { minimo: 40, maximo: 70 }, temperatura: { minimo: 18, maximo: 28 } }],
  ['com mínimo maior que o máximo', { ...FAIXAS_DE_TESTE, temperatura: { minimo: 30, maximo: 18 } }],
  ['com texto no lugar de número', { ...FAIXAS_DE_TESTE, luminosidade: { minimo: 'pouca', maximo: 20000 } }],
])('faixas %s não derrubam o registro: a planta fica sem faixas', (_, faixas) => {
  const planta = deRegistro({ id: 'p1', idEspecie: 'tomate', apelido: 'Tom', faixasRecomendadas: faixas });
  expect(planta?.apelido).toBe('Tom');
  expect(planta?.faixasRecomendadas).toBeNull();
});

test('a data de cadastro é gravada como texto ISO', () => {
  const planta = Planta.criar({
    id: 'p1',
    idEspecie: 'tomate',
    apelido: 'Tom',
    aparencia: APARENCIA_INICIAL,
    cadastradaEm: new Date('2026-10-17T14:00:00.000Z'),
  });
  expect(paraRegistro(planta).cadastradaEm).toBe('2026-10-17T14:00:00.000Z');
});

test.each([undefined, null, 'ontem', 42])('registro antigo com data %p continua legível, com data desconhecida', (data) => {
  const planta = deRegistro({ id: 'p1', idEspecie: 'tomate', apelido: 'Tom', cadastradaEm: data });
  expect(planta?.apelido).toBe('Tom');
  expect(planta?.cadastradaEm).toBeNull();
});

test('registro sem aparência ganha a aparência inicial', () => {
  expect(deRegistro({ id: 'p1', idEspecie: 'tomate', apelido: 'Tom' })?.aparencia).toEqual(APARENCIA_INICIAL);
});

test('registro antigo sem jardim entra no jardim principal', () => {
  expect(deRegistro({ id: 'p1', idEspecie: 'tomate', apelido: 'Tom' })?.idJardim).toBe(ID_JARDIM_PRINCIPAL);
});

test.each([null, 42, ''])('id de jardim inválido %p usa o jardim principal', (idJardim) => {
  expect(deRegistro({ id: 'p1', idJardim, idEspecie: 'tomate', apelido: 'Tom' })?.idJardim).toBe(
    ID_JARDIM_PRINCIPAL,
  );
});

test('registro com id de forma desconhecido mantém o resto da aparência', () => {
  const planta = deRegistro({
    id: 'p1',
    idEspecie: 'tomate',
    apelido: 'Tom',
    aparencia: { forma: 'bonsai', folhagem: 'menta', destaque: 'rosa', vaso: 'creme' },
  });
  expect(planta?.aparencia).toEqual({ forma: 'erva', folhagem: 'menta', destaque: 'rosa', vaso: 'creme' });
});

test.each([{ id: 'p1' }, 'lixo', null, { id: 'p1', idEspecie: 'tomate', apelido: '   ' }])(
  'registro ilegível %p vira null',
  (bruto) => {
    expect(deRegistro(bruto)).toBeNull();
  },
);

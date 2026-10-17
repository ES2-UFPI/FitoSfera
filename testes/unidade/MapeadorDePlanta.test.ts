import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { Planta } from '@/dominio/modelos/Planta';
import { deRegistro, paraRegistro } from '@/infraestrutura/persistencia/MapeadorDePlanta';

test('ida e volta preserva todos os campos', () => {
  const planta = Planta.criar({
    id: 'p1',
    idEspecie: 'tomate',
    apelido: 'Tom',
    aparencia: { forma: 'frutifera', folhagem: 'roxo', destaque: 'amarelo', vaso: 'azul' },
    cadastradaEm: new Date('2026-10-17T14:00:00.000Z'),
  });
  expect(deRegistro(JSON.parse(JSON.stringify(paraRegistro(planta))))).toEqual(planta);
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

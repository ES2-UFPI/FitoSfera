import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { Planta } from '@/dominio/modelos/Planta';
import { deRegistro, paraRegistro } from '@/infraestrutura/persistencia/MapeadorDePlanta';

test('ida e volta preserva todos os campos', () => {
  const planta = Planta.criar({
    id: 'p1',
    idEspecie: 'tomate',
    apelido: 'Tom',
    aparencia: { forma: 'frutifera', folhagem: 'roxo', destaque: 'amarelo', vaso: 'azul' },
  });
  expect(deRegistro(JSON.parse(JSON.stringify(paraRegistro(planta))))).toEqual(planta);
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

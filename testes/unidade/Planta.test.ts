import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { ApelidoInvalido, ID_JARDIM_PRINCIPAL, Planta } from '@/dominio/modelos/Planta';

const base = { id: 'p1', idEspecie: 'tomate', aparencia: APARENCIA_INICIAL };

test('criar apara os espaços do apelido', () => {
  expect(Planta.criar({ ...base, apelido: '  Tomatinho  ' }).apelido).toBe('Tomatinho');
});

test('planta sem jardim informado entra no jardim principal', () => {
  expect(Planta.criar({ ...base, apelido: 'Tomatinho' }).idJardim).toBe(ID_JARDIM_PRINCIPAL);
});

test('editar preserva o jardim da planta', () => {
  const original = Planta.criar({ ...base, idJardim: 'varanda', apelido: 'Tomatinho' });
  expect(original.editar({ apelido: 'Tom', aparencia: APARENCIA_INICIAL }).idJardim).toBe('varanda');
});

test('apelido só com espaços é recusado', () => {
  expect(() => Planta.criar({ ...base, apelido: '   ' })).toThrow(ApelidoInvalido);
});

test('apelido com 30 caracteres passa e com 31 é recusado', () => {
  expect(Planta.criar({ ...base, apelido: 'a'.repeat(30) }).apelido).toHaveLength(30);
  expect(() => Planta.criar({ ...base, apelido: 'a'.repeat(31) })).toThrow(ApelidoInvalido);
});

test('emoji conta como um caractere e acentos são preservados', () => {
  // "Manjericão 🌿" tem 12 caracteres visíveis; com mais 18 chega exatamente ao limite de 30.
  const apelido = 'Manjericão 🌿' + 'x'.repeat(18);
  expect(Planta.criar({ ...base, apelido }).apelido).toBe(apelido);
});

test('editar troca apelido e aparência e mantém espécie, data de cadastro e faixas', () => {
  const faixasRecomendadas = {
    umidadeDoAr: { minimo: 40, maximo: 70 },
    temperatura: { minimo: 18, maximo: 28 },
    luminosidade: { minimo: 5000, maximo: 20000 },
  };
  const cadastradaEm = new Date(2026, 9, 1, 9, 0);
  const original = Planta.criar({ ...base, apelido: 'Tomatinho', cadastradaEm, faixasRecomendadas });
  const aparencia = { ...APARENCIA_INICIAL, vaso: 'azul' as const };

  const editada = original.editar({ apelido: '  Tomatão ', aparencia });

  expect(editada).toEqual(
    Planta.criar({ ...base, apelido: 'Tomatão', aparencia, cadastradaEm, faixasRecomendadas }),
  );
  expect(original.apelido).toBe('Tomatinho');
});

test('editar recusa apelido inválido', () => {
  const original = Planta.criar({ ...base, apelido: 'Tomatinho' });
  expect(() => original.editar({ apelido: ' ', aparencia: APARENCIA_INICIAL })).toThrow(ApelidoInvalido);
});

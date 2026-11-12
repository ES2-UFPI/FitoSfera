import { Planta } from '@/dominio/modelos/Planta';
import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { estagioDaPlanta } from '@/dominio/regras/EstagioDaPlanta';

const especie: EspecieVegetal = {
  id: 'tomate',
  nomeComum: 'Tomate',
  nomeCientifico: 'Solanum lycopersicum',
  nomesAlternativos: [],
  foto: null,
  faixasIdeais: null,
  intervaloDeRegaEmDias: 3,
  nivelDeDificuldade: 'medio',
  cicloAteColheitaEmDias: { minimo: 60, maximo: 90 },
  frutifera: true,
  estagiosDeDesenvolvimento: [
    { nome: 'muda', duracaoEmDias: 7 },
    { nome: 'crescimento', duracaoEmDias: 20 },
    { nome: 'floração', duracaoEmDias: 8 },
    { nome: 'frutificação', duracaoEmDias: 10 },
  ],
};

function planta(cadastradaEm: Date | null): Planta {
  return Planta.criar({ id: 'p1', idEspecie: especie.id, apelido: 'Tomatinho', aparencia: APARENCIA_INICIAL, cadastradaEm });
}

function data(dias: number): Date {
  return new Date(2026, 0, 1 + dias, 12, 0);
}

describe('estagioDaPlanta', () => {
  test.each([
    [0, 'muda'],
    [6, 'muda'],
    [7, 'crescimento'],
    [26, 'crescimento'],
    [27, 'floração'],
    [34, 'floração'],
    [35, 'frutificação'],
    [45, 'frutificação'],
    [200, 'frutificação'],
  ])('no dia %i, retorna o estágio %s', (dias, nomeEsperado) => {
    expect(estagioDaPlanta(planta(data(0)), especie, data(dias))?.nome).toBe(nomeEsperado);
  });

  test('sem data de cadastro retorna null', () => {
    expect(estagioDaPlanta(planta(null), especie, data(10))).toBeNull();
  });

  test('com data de cadastro inválida retorna null', () => {
    expect(estagioDaPlanta(planta(new Date('inválida')), especie, data(10))).toBeNull();
  });

  test('com data atual inválida retorna null', () => {
    expect(estagioDaPlanta(planta(data(0)), especie, new Date('inválida'))).toBeNull();
  });

  test('espécie sem estágios retorna null', () => {
    expect(estagioDaPlanta(planta(data(0)), { ...especie, estagiosDeDesenvolvimento: undefined }, data(10))).toBeNull();
  });

  test('espécie com lista vazia retorna null', () => {
    expect(estagioDaPlanta(planta(data(0)), { ...especie, estagiosDeDesenvolvimento: [] }, data(10))).toBeNull();
  });

  test('relógio anterior ao cadastro mantém o primeiro estágio', () => {
    expect(estagioDaPlanta(planta(data(10)), especie, data(0))?.nome).toBe('muda');
  });
});

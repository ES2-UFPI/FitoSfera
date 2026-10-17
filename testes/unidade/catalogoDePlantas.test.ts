import catalogo from '@/infraestrutura/catalogo/catalogo-plantas.json';
import { validarCatalogo } from '@/infraestrutura/catalogo/validarCatalogo';
import { especieDeTeste } from '../apoio/especiesDeTeste';

// O CI roda este arquivo num passo próprio: catálogo inválido reprova o pull request.
describe('catalogo-plantas.json', () => {
  test('passa na validação', () => {
    expect(validarCatalogo(catalogo)).toEqual([]);
  });

  test('tem cerca de 30 espécies', () => {
    expect(catalogo.length).toBeGreaterThanOrEqual(28);
  });
});

describe('validarCatalogo', () => {
  const valida = especieDeTeste({ id: 'tomate', nomeComum: 'Tomate', nomeCientifico: 'Solanum lycopersicum', nomesAlternativos: [] });
  const comFaixa = (grandeza: string, faixa: unknown) => ({
    ...valida,
    faixasIdeais: { ...valida.faixasIdeais, [grandeza]: faixa },
  });

  test('aceita uma espécie completa, com ou sem ciclo de colheita', () => {
    expect(validarCatalogo([valida, { ...valida, id: 'alface', cicloAteColheitaEmDias: { minimo: 45, maximo: 70 } }])).toEqual([]);
  });

  test('reprova o que não é lista', () => {
    expect(validarCatalogo({ especies: [] })).toEqual(['o catálogo precisa ser uma lista de espécies']);
  });

  test('reprova id repetido, citando a espécie', () => {
    expect(validarCatalogo([valida, valida])).toEqual(['espécie 2 (tomate): id "tomate" repetido']);
  });

  test('reprova id fora de kebab-case', () => {
    expect(validarCatalogo([{ ...valida, id: 'Capim Limão' }])).toHaveLength(1);
  });

  test('reprova faixa com mínimo maior ou igual ao máximo', () => {
    const erros = validarCatalogo([comFaixa('temperatura', { minimo: 30, maximo: 18, fonte: 'X' })]);
    expect(erros).toEqual(['espécie 1 (tomate): faixasIdeais.temperatura tem minimo (30) maior ou igual ao maximo (18)']);
    expect(validarCatalogo([comFaixa('luminosidade', { minimo: 500, maximo: 500, fonte: 'X' })])).toHaveLength(1);
  });

  test('reprova faixa ausente, sem fonte ou fora dos limites físicos', () => {
    expect(validarCatalogo([comFaixa('umidadeDoAr', undefined)])).toEqual([
      'espécie 1 (tomate): faixasIdeais.umidadeDoAr é obrigatória',
    ]);
    expect(validarCatalogo([comFaixa('umidadeDoAr', { minimo: 40, maximo: 70, fonte: ' ' })])).toHaveLength(1);
    expect(validarCatalogo([comFaixa('umidadeDoAr', { minimo: 40, maximo: 140, fonte: 'X' })])).toHaveLength(1);
  });

  test('reprova nomes obrigatórios vazios', () => {
    expect(validarCatalogo([{ ...valida, nomeComum: '', nomeCientifico: undefined }])).toEqual([
      'espécie 1 (tomate): nomeComum é obrigatório',
      'espécie 1 (tomate): nomeCientifico é obrigatório',
    ]);
  });

  test('reprova rega, dificuldade e ciclo inválidos', () => {
    const erros = validarCatalogo([
      { ...valida, intervaloDeRegaEmDias: 0, nivelDeDificuldade: 'impossivel', cicloAteColheitaEmDias: { minimo: 90, maximo: 60 } },
    ]);
    expect(erros).toHaveLength(3);
  });
});

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

  test('marca como frutíferas só as espécies que dão frutos (US15)', () => {
    expect(catalogo.filter((especie) => especie.frutifera).map((especie) => especie.id)).toEqual([
      'abobrinha',
      'limoeiro',
      'morango',
      'pimenta',
      'pimentao',
      'tomate',
    ]);
  });

  test('toda frutífera tem média dentro do ciclo e estágios que cobrem o tempo até a primeira colheita', () => {
    for (const especie of catalogo.filter((item) => item.frutifera)) {
      const estagios = especie.estagiosDeDesenvolvimento ?? [];
      expect(especie.cicloAteColheitaEmDias).not.toBeNull();
      expect(especie.tempoMedioAteColheitaEmDias).toBeGreaterThanOrEqual(especie.cicloAteColheitaEmDias!.minimo);
      expect(especie.tempoMedioAteColheitaEmDias).toBeLessThanOrEqual(especie.cicloAteColheitaEmDias!.maximo);
      expect(estagios.map((estagio) => estagio.nome)).toEqual([
        'muda', 'crescimento', 'floração', 'frutificação',
      ]);
      expect(estagios.reduce((soma, estagio) => soma + estagio.duracaoEmDias, 0))
        .toBe(especie.tempoMedioAteColheitaEmDias);
    }
    expect(catalogo.filter((item) => !item.frutifera).every((item) =>
      !('tempoMedioAteColheitaEmDias' in item) && !('estagiosDeDesenvolvimento' in item))).toBe(true);
  });
});

describe('validarCatalogo', () => {
  const valida = especieDeTeste({ id: 'tomate', nomeComum: 'Tomate', nomeCientifico: 'Solanum lycopersicum', nomesAlternativos: [] });
  const frutiferaValida = { ...valida, frutifera: true, tempoMedioAteColheitaEmDias: 60,
    estagiosDeDesenvolvimento: [{ nome: 'muda', duracaoEmDias: 10 }, { nome: 'frutificação', duracaoEmDias: 50 }] };
  const comFaixa = (grandeza: string, faixa: unknown) => ({
    ...valida,
    faixasIdeais: { ...valida.faixasIdeais, [grandeza]: faixa },
  });

  test('exige dizer se a espécie é frutífera', () => {
    const { frutifera: _semCampo, ...semFrutifera } = valida;
    expect(validarCatalogo([semFrutifera])).toEqual(['espécie 1 (tomate): frutifera precisa ser true ou false']);
    expect(validarCatalogo([{ ...valida, frutifera: 'sim' }])).toEqual([
      'espécie 1 (tomate): frutifera precisa ser true ou false',
    ]);
  });

  test('aceita uma espécie completa, com ou sem ciclo de colheita', () => {
    expect(validarCatalogo([valida, { ...valida, id: 'alface', cicloAteColheitaEmDias: { minimo: 45, maximo: 70 } },
      { ...frutiferaValida, id: 'morango' }])).toEqual([]);
  });

  test('frutífera exige média e estágios, sem exigir esses campos para as demais', () => {
    expect(validarCatalogo([valida])).toEqual([]);
    expect(validarCatalogo([{ ...valida, frutifera: true }])).toEqual([
      'espécie 1 (tomate): tempoMedioAteColheitaEmDias precisa ser um inteiro positivo',
      'espécie 1 (tomate): estagiosDeDesenvolvimento precisa ser uma lista não vazia',
    ]);
    expect(validarCatalogo([{ ...frutiferaValida, estagiosDeDesenvolvimento: [] }])).toContain(
      'espécie 1 (tomate): estagiosDeDesenvolvimento precisa ser uma lista não vazia',
    );
  });

  test('reprova durações inválidas e média que não bate com a soma dos estágios', () => {
    expect(validarCatalogo([{ ...frutiferaValida, tempoMedioAteColheitaEmDias: 0 }])).toContain(
      'espécie 1 (tomate): tempoMedioAteColheitaEmDias precisa ser um inteiro positivo',
    );
    expect(validarCatalogo([{ ...frutiferaValida, estagiosDeDesenvolvimento: [{ nome: ' ', duracaoEmDias: 0 }] }])).toContain(
      'espécie 1 (tomate): estagiosDeDesenvolvimento[0] precisa de nome e duracaoEmDias inteiro positivo',
    );
    expect(validarCatalogo([{ ...frutiferaValida, tempoMedioAteColheitaEmDias: 61 }])).toEqual([
      'espécie 1 (tomate): a soma dos estágios precisa ser igual ao tempoMedioAteColheitaEmDias',
    ]);
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

  test('exige a meta diária de luz e as faixas da noite, com fonte', () => {
    expect(validarCatalogo([comFaixa('luzDiaria', undefined)])).toEqual([
      'espécie 1 (tomate): faixasIdeais.luzDiaria é obrigatória',
    ]);
    expect(validarCatalogo([comFaixa('temperaturaNoturna', undefined)])).toEqual([
      'espécie 1 (tomate): faixasIdeais.temperaturaNoturna é obrigatória',
    ]);
    expect(validarCatalogo([comFaixa('umidadeDoArNoturna', { minimo: 40, maximo: 80, fonte: '' })])).toEqual([
      'espécie 1 (tomate): faixasIdeais.umidadeDoArNoturna precisa citar a fonte',
    ]);
  });

  test('reprova meta diária de luz fora do que o sol entrega', () => {
    expect(validarCatalogo([comFaixa('luzDiaria', { minimo: 12, maximo: 800, fonte: 'X' })])).toEqual([
      'espécie 1 (tomate): faixasIdeais.luzDiaria precisa ficar entre 0 e 70',
    ]);
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

import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { FaixasRecomendadas } from '@/dominio/modelos/FaixaRecomendada';

/** As faixas de toda espécie de teste, sem a fonte: é o que a planta guarda no cadastro. */
export const FAIXAS_DE_TESTE: FaixasRecomendadas = {
  umidadeDoAr: { minimo: 40, maximo: 70 },
  temperatura: { minimo: 18, maximo: 28 },
  luminosidade: { minimo: 5000, maximo: 20000 },
  luzDiaria: { minimo: 12, maximo: 16 },
  umidadeDoArNoturna: { minimo: 40, maximo: 80 },
  temperaturaNoturna: { minimo: 13, maximo: 23 },
};

/** Espécie válida com valores neutros; cada teste informa só os nomes que importam para ele. */
export function especieDeTeste(
  nomes: Pick<EspecieVegetal, 'id' | 'nomeComum' | 'nomeCientifico' | 'nomesAlternativos'>,
  extra: Partial<EspecieVegetal> = {},
): EspecieVegetal {
  const fonte = 'Fonte de teste';
  return {
    ...nomes,
    foto: null,
    faixasIdeais: {
      umidadeDoAr: { ...FAIXAS_DE_TESTE.umidadeDoAr, fonte },
      temperatura: { ...FAIXAS_DE_TESTE.temperatura, fonte },
      luminosidade: { ...FAIXAS_DE_TESTE.luminosidade, fonte },
      luzDiaria: { ...FAIXAS_DE_TESTE.luzDiaria!, fonte },
      umidadeDoArNoturna: { ...FAIXAS_DE_TESTE.umidadeDoArNoturna!, fonte },
      temperaturaNoturna: { ...FAIXAS_DE_TESTE.temperaturaNoturna!, fonte },
    },
    intervaloDeRegaEmDias: 3,
    nivelDeDificuldade: 'facil',
    cicloAteColheitaEmDias: null,
    frutifera: false,
    // Sem ficha, e explicitamente: espécie de teste não herda a ficha de manejo do catálogo real pelo id.
    exigencias: null,
    ...extra,
  };
}

export const ESPECIES_DE_TESTE: readonly EspecieVegetal[] = [
  especieDeTeste(
    { id: 'tomate', nomeComum: 'Tomate', nomeCientifico: 'Solanum lycopersicum', nomesAlternativos: ['Tomateiro'] },
    {
      frutifera: true,
      cicloAteColheitaEmDias: { minimo: 65, maximo: 90 },
      tempoMedioAteColheitaEmDias: 75,
      estagiosDeDesenvolvimento: [
        { nome: 'muda', duracaoEmDias: 7 },
        { nome: 'crescimento', duracaoEmDias: 20 },
        { nome: 'floração', duracaoEmDias: 6 },
        { nome: 'frutificação', duracaoEmDias: 42 },
      ],
    },
  ),
  especieDeTeste({ id: 'jiboia', nomeComum: 'Jiboia', nomeCientifico: 'Epipremnum aureum', nomesAlternativos: ['Pothos'] }),
  especieDeTeste({
    id: 'espada-de-sao-jorge',
    nomeComum: 'Espada-de-são-jorge',
    nomeCientifico: 'Dracaena trifasciata',
    nomesAlternativos: ['Sansevieria'],
  }),
  especieDeTeste({ id: 'alface', nomeComum: 'Alface', nomeCientifico: 'Lactuca sativa', nomesAlternativos: [] }),
  especieDeTeste({
    id: 'lavanda',
    nomeComum: 'Lavanda',
    nomeCientifico: 'Lavandula angustifolia',
    nomesAlternativos: ['Alfazema'],
  }),
];

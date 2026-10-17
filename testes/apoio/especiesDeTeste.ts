import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';

/** Espécie válida com valores neutros; cada teste informa só os nomes que importam para ele. */
export function especieDeTeste(
  nomes: Pick<EspecieVegetal, 'id' | 'nomeComum' | 'nomeCientifico' | 'nomesAlternativos'>,
): EspecieVegetal {
  const fonte = 'Fonte de teste';
  return {
    ...nomes,
    foto: null,
    faixasIdeais: {
      umidadeDoAr: { minimo: 40, maximo: 70, fonte },
      temperatura: { minimo: 18, maximo: 28, fonte },
      luminosidade: { minimo: 5000, maximo: 20000, fonte },
    },
    intervaloDeRegaEmDias: 3,
    nivelDeDificuldade: 'facil',
    cicloAteColheitaEmDias: null,
  };
}

export const ESPECIES_DE_TESTE: readonly EspecieVegetal[] = [
  especieDeTeste({ id: 'tomate', nomeComum: 'Tomate', nomeCientifico: 'Solanum lycopersicum', nomesAlternativos: ['Tomateiro'] }),
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

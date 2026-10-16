import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';

export const ESPECIES_DE_TESTE: readonly EspecieVegetal[] = [
  { id: 'tomate', nomeComum: 'Tomate', nomeCientifico: 'Solanum lycopersicum', nomesAlternativos: ['Tomateiro'] },
  { id: 'jiboia', nomeComum: 'Jiboia', nomeCientifico: 'Epipremnum aureum', nomesAlternativos: ['Pothos'] },
  {
    id: 'espada-de-sao-jorge',
    nomeComum: 'Espada-de-são-jorge',
    nomeCientifico: 'Dracaena trifasciata',
    nomesAlternativos: ['Sansevieria'],
  },
  { id: 'alface', nomeComum: 'Alface', nomeCientifico: 'Lactuca sativa', nomesAlternativos: [] },
  { id: 'lavanda', nomeComum: 'Lavanda', nomeCientifico: 'Lavandula angustifolia', nomesAlternativos: ['Alfazema'] },
];

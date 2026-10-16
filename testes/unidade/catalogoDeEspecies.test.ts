import especies from '@/infraestrutura/catalogo/especies.json';

test('catálogo tem pelo menos 30 espécies com ids únicos em kebab-case', () => {
  expect(especies.length).toBeGreaterThanOrEqual(30);
  expect(new Set(especies.map((e) => e.id)).size).toBe(especies.length);
  especies.forEach((e) => expect(e.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
});

test('toda espécie tem nome comum, nome científico e lista de nomes alternativos', () => {
  especies.forEach((e) => {
    expect(e.nomeComum.trim()).not.toBe('');
    expect(e.nomeCientifico.trim()).not.toBe('');
    expect(Array.isArray(e.nomesAlternativos)).toBe(true);
  });
});

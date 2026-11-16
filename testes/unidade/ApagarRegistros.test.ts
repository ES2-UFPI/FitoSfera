import { ApagarRegistros } from '@/aplicacao/casos-de-uso/ApagarRegistros';
import { RepositorioDeColheitasEmMemoria, RepositorioDeRegasEmMemoria } from '../apoio/fakes';

const quando = new Date(2026, 10, 15, 16, 58);

test('apaga a rega e a colheita pedidas, só da planta indicada', async () => {
  const regas = new RepositorioDeRegasEmMemoria(false, [
    { id: 'r1', idPlanta: 'p1', regadaEm: quando },
    { id: 'r2', idPlanta: 'p1', regadaEm: quando },
  ]);
  const colheitas = new RepositorioDeColheitasEmMemoria([
    { id: 'c1', idPlanta: 'p1', quantidade: 3, unidade: 'unidades', colhidaEm: quando },
  ]);
  const caso = new ApagarRegistros(regas, colheitas);

  await caso.apagarRega('p1', 'r2');
  await caso.apagarColheita('p2', 'c1');
  expect(regas.salvas.map((r) => r.id)).toEqual(['r1']);
  expect(colheitas.salvas).toHaveLength(1);

  await caso.apagarColheita('p1', 'c1');
  expect(colheitas.salvas).toHaveLength(0);
});

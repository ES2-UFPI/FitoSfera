import { PedidoDeComparacao, PoucasPlantasParaComparar } from '@/aplicacao/casos-de-uso/CompararRendimento';
import { RegistroDeColheita } from '@/dominio/modelos/RegistroDeColheita';
import { criarContainerDeTeste, plantaDeTeste } from '../apoio/fakes';

const agora = new Date(2026, 10, 12, 15, 0);
const diasAtras = (dias: number, hora = 10) => new Date(2026, 10, 12 - dias, hora, 0);
let proximoId = 1;
function colheita(
  idPlanta: string,
  quantidade: number,
  colhidaEm: Date,
  unidade: RegistroDeColheita['unidade'] = 'unidades',
): RegistroDeColheita {
  return { id: `c${proximoId++}`, idPlanta, quantidade, unidade, colhidaEm };
}

const plantas = [
  plantaDeTeste({ id: 'p1', apelido: 'Tomatinho' }),
  plantaDeTeste({ id: 'p2', apelido: 'Cereja' }),
  plantaDeTeste({ id: 'p3', apelido: 'Italiano' }),
];

function comparar(colheitas: readonly RegistroDeColheita[], pedido: Partial<PedidoDeComparacao> = {}) {
  const { container } = criarContainerDeTeste({ agora, plantas, colheitas });
  return container.compararRendimento.executar({ idsDasPlantas: ['p1', 'p2', 'p3'], dias: 30, unidade: 'unidades', ...pedido });
}

test('compara várias plantas no mesmo período, do maior para o menor rendimento', async () => {
  const resultado = await comparar([
    colheita('p1', 4, diasAtras(2)),
    colheita('p2', 10, diasAtras(5)),
    colheita('p2', 3, diasAtras(1)),
    colheita('p3', 7, diasAtras(20)),
  ]);

  const linhas = resultado.plantas.map(({ planta, rendimento }) => [
    planta.apelido,
    rendimento.quantidadeTotal,
    rendimento.numeroDeColheitas,
  ]);
  expect(linhas).toEqual([
    ['Cereja', 13, 2],
    ['Italiano', 7, 1],
    ['Tomatinho', 4, 1],
  ]);
});

test('planta sem colheitas no período aparece com rendimento zero, sem erro', async () => {
  const resultado = await comparar([colheita('p1', 5, diasAtras(1)), colheita('p3', 9, diasAtras(60))]);

  expect(resultado.plantas.map(({ planta, rendimento }) => [planta.apelido, rendimento.quantidadeTotal])).toEqual([
    ['Tomatinho', 5],
    ['Cereja', 0],
    ['Italiano', 0],
  ]);
});

test('só conta colheitas dentro do período escolhido', async () => {
  const registros = [colheita('p1', 5, diasAtras(3)), colheita('p2', 8, diasAtras(10))];

  const semana = await comparar(registros, { dias: 7 });
  const mes = await comparar(registros, { dias: 30 });

  expect(semana.plantas[0].planta.apelido).toBe('Tomatinho');
  expect(semana.plantas.find(({ planta }) => planta.id === 'p2')?.rendimento.quantidadeTotal).toBe(0);
  expect(mes.plantas[0].planta.apelido).toBe('Cereja');
});

test('compara numa unidade só: gramas não se somam a frutos contados', async () => {
  const registros = [colheita('p1', 3, diasAtras(1)), colheita('p2', 500, diasAtras(1), 'gramas')];

  const emGramas = await comparar(registros, { unidade: 'gramas' });

  expect(emGramas.plantas.map(({ planta, rendimento }) => [planta.apelido, rendimento.quantidadeTotal])).toEqual([
    ['Cereja', 500],
    ['Italiano', 0],
    ['Tomatinho', 0],
  ]);
});

test('empate no total vai para quem colheu mais vezes', async () => {
  const resultado = await comparar(
    [colheita('p1', 6, diasAtras(1)), colheita('p2', 3, diasAtras(1)), colheita('p2', 3, diasAtras(2))],
    { idsDasPlantas: ['p1', 'p2'] },
  );
  expect(resultado.plantas.map(({ planta }) => planta.apelido)).toEqual(['Cereja', 'Tomatinho']);
});

test('menos de duas plantas não dá para comparar', async () => {
  await expect(comparar([], { idsDasPlantas: ['p1'] })).rejects.toBeInstanceOf(PoucasPlantasParaComparar);
  await expect(comparar([], { idsDasPlantas: ['p1', 'p1'] })).rejects.toBeInstanceOf(PoucasPlantasParaComparar);
});

test('planta que saiu do jardim fica de fora da comparação', async () => {
  const resultado = await comparar([], { idsDasPlantas: ['p1', 'p2', 'sumiu'] });
  expect(resultado.plantas.map(({ planta }) => planta.id).sort()).toEqual(['p1', 'p2']);
});

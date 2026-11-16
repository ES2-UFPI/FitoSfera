import {
  DIAS_DO_INDICADOR_DE_RENDIMENTO,
  ObterColheitasDaPlanta,
} from '@/aplicacao/casos-de-uso/ObterColheitasDaPlanta';
import { RegistroDeColheita, UnidadeDeColheita } from '@/dominio/modelos/RegistroDeColheita';
import { RelogioParado, RepositorioDeColheitasEmMemoria } from '../apoio/fakes';

/** 12/11/2026 às 10:00, no fuso do aparelho. */
const agora = new Date(2026, 10, 12, 10, 0);

const colheita = (
  id: string,
  colhidaEm: Date,
  quantidade: number,
  unidade: UnidadeDeColheita = 'unidades',
  idPlanta = 'tomateiro',
): RegistroDeColheita => ({ id, idPlanta, quantidade, unidade, colhidaEm });

function montar(registros: RegistroDeColheita[]) {
  return new ObterColheitasDaPlanta(new RepositorioDeColheitasEmMemoria(registros), new RelogioParado(agora));
}

test('planta sem colheitas devolve histórico vazio e rendimento zerado, sem erro', async () => {
  const resultado = await montar([]).executar('tomateiro');

  expect(resultado.registros).toEqual([]);
  expect(resultado.rendimento).toEqual({
    unidades: { unidade: 'unidades', quantidadeTotal: 0, numeroDeColheitas: 0 },
    gramas: { unidade: 'gramas', quantidadeTotal: 0, numeroDeColheitas: 0 },
  });
});

test('lista todas as colheitas da planta, da mais recente para a mais antiga, mesmo as de fora do período', async () => {
  const resultado = await montar([
    colheita('antiga', new Date(2026, 0, 10), 4),
    colheita('recente', new Date(2026, 10, 11), 6),
    colheita('do-meio', new Date(2026, 9, 1), 5),
    colheita('de-outra', new Date(2026, 10, 12), 9, 'unidades', 'pimenteira'),
  ]).executar('tomateiro');

  expect(resultado.registros.map((registro) => registro.id)).toEqual(['recente', 'do-meio', 'antiga']);
});

test('o indicador soma só os últimos 30 dias, separado por medida', async () => {
  const resultado = await montar([
    colheita('hoje', new Date(2026, 10, 12, 8), 6),
    colheita('semana-passada', new Date(2026, 10, 5), 4),
    colheita('pesada', new Date(2026, 10, 1), 350.5, 'gramas'),
    // 30 dias até hoje começam em 14/10 à meia-noite: 13/10 já fica de fora.
    colheita('fora', new Date(2026, 9, 13, 23, 59), 100),
  ]).executar('tomateiro');

  expect(DIAS_DO_INDICADOR_DE_RENDIMENTO).toBe(30);
  expect(resultado.periodo).toEqual({ inicio: new Date(2026, 9, 14), fim: agora });
  expect(resultado.rendimento.unidades).toEqual({ unidade: 'unidades', quantidadeTotal: 10, numeroDeColheitas: 2 });
  expect(resultado.rendimento.gramas).toEqual({ unidade: 'gramas', quantidadeTotal: 350.5, numeroDeColheitas: 1 });
});

test('aceita outro tamanho de período', async () => {
  const resultado = await montar([colheita('mes-passado', new Date(2026, 9, 20), 7)]).executar('tomateiro', 7);
  expect(resultado.rendimento.unidades.numeroDeColheitas).toBe(0);
});

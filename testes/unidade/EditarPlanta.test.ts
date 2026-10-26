import { PlantaNaoEncontrada } from '@/aplicacao/casos-de-uso/EditarPlanta';
import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { criarContainerDeTeste, plantaDeTeste } from '../apoio/fakes';

const aparencia = { ...APARENCIA_INICIAL, folhagem: 'roxo' as const };

test('grava o apelido e a aparência novos sem mexer na data de cadastro nem nas regas', async () => {
  const cadastradaEm = new Date(2026, 9, 1, 9, 0);
  const rega = { id: 'r1', idPlanta: 'p1', regadaEm: new Date(2026, 9, 2, 8, 0) };
  const { container, plantas, regas } = criarContainerDeTeste({ plantas: [plantaDeTeste({ cadastradaEm })] });
  await regas.gravar(rega);

  await container.editarPlanta.executar('p1', { apelido: 'Tomatão', aparencia });

  const salva = await plantas.obterPorId('p1');
  expect(salva?.apelido).toBe('Tomatão');
  expect(salva?.aparencia).toEqual(aparencia);
  expect(salva?.cadastradaEm).toEqual(cadastradaEm);
  expect(await regas.listarPorPlanta('p1')).toEqual([rega]);
});

test('planta que saiu do jardim não é recriada', async () => {
  const { container, plantas } = criarContainerDeTeste();
  await expect(container.editarPlanta.executar('p9', { apelido: 'Nova', aparencia })).rejects.toThrow(
    PlantaNaoEncontrada,
  );
  expect(plantas.salvas).toHaveLength(0);
});

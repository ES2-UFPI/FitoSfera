import { GeradorDeIdentificadorAleatorio } from '@/infraestrutura/identificador/GeradorDeIdentificadorAleatorio';

test('gera 1000 ids não vazios e distintos', () => {
  const gerador = new GeradorDeIdentificadorAleatorio();
  const ids = Array.from({ length: 1000 }, () => gerador.gerar());
  ids.forEach((id) => expect(id.length).toBeGreaterThan(0));
  expect(new Set(ids).size).toBe(1000);
});

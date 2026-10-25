import { JANELA_PADRAO, JanelaDeLembretes } from '@/dominio/modelos/JanelaDeLembretes';
import { CHAVES } from '@/infraestrutura/persistencia/chaves';
import { RepositorioDePreferenciasAsyncStorage } from '@/infraestrutura/persistencia/RepositorioDePreferenciasAsyncStorage';
import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';

const montar = (iniciais: Record<string, string> = {}) => {
  const armazenamento = new ArmazenamentoEmMemoria(iniciais);
  return { armazenamento, repositorio: new RepositorioDePreferenciasAsyncStorage(armazenamento) };
};

const NOTURNA: JanelaDeLembretes = { inicio: { hora: 22, minuto: 30 }, fim: { hora: 7, minuto: 15 } };

test('sem nada gravado, vale a janela padrão', async () => {
  expect(await montar().repositorio.obterJanelaDeLembretes()).toEqual(JANELA_PADRAO);
});

test('a janela escolhida sobrevive a fechar e reabrir o app', async () => {
  const { armazenamento, repositorio } = montar();
  await repositorio.definirJanelaDeLembretes(NOTURNA);

  const reaberto = new RepositorioDePreferenciasAsyncStorage(armazenamento);
  expect(await reaberto.obterJanelaDeLembretes()).toEqual(NOTURNA);
});

test('grava na chave de preferências do mapa de chaves', async () => {
  const { armazenamento, repositorio } = montar();
  await repositorio.definirJanelaDeLembretes(NOTURNA);

  expect(JSON.parse(armazenamento.valores.get(CHAVES.preferencias)!)).toEqual({ janelaDeLembretes: NOTURNA });
});

test('grava só hora e minuto, sem campos extras que vierem no objeto', async () => {
  const { armazenamento, repositorio } = montar();
  await repositorio.definirJanelaDeLembretes({
    ...NOTURNA,
    inicio: { ...NOTURNA.inicio, segundo: 42 },
  } as JanelaDeLembretes);

  expect(JSON.parse(armazenamento.valores.get(CHAVES.preferencias)!).janelaDeLembretes.inicio).toEqual({
    hora: 22,
    minuto: 30,
  });
});

describe('conteúdo que não dá para usar cai na janela padrão', () => {
  const casos: readonly [string, string][] = [
    ['texto que não é JSON', 'nem json'],
    ['JSON que não é objeto', '"janela"'],
    ['objeto sem a janela', '{}'],
    ['janela sem o fim', '{"janelaDeLembretes":{"inicio":{"hora":8,"minuto":0}}}'],
    ['hora fora de 0–23', '{"janelaDeLembretes":{"inicio":{"hora":24,"minuto":0},"fim":{"hora":9,"minuto":0}}}'],
    ['minuto fora de 0–59', '{"janelaDeLembretes":{"inicio":{"hora":8,"minuto":60},"fim":{"hora":9,"minuto":0}}}'],
    ['hora negativa', '{"janelaDeLembretes":{"inicio":{"hora":-1,"minuto":0},"fim":{"hora":9,"minuto":0}}}'],
    ['hora fracionada', '{"janelaDeLembretes":{"inicio":{"hora":8.5,"minuto":0},"fim":{"hora":9,"minuto":0}}}'],
    ['hora em texto', '{"janelaDeLembretes":{"inicio":{"hora":"8","minuto":0},"fim":{"hora":9,"minuto":0}}}'],
  ];

  for (const [descricao, bruto] of casos) {
    test(descricao, async () => {
      const { repositorio } = montar({ [CHAVES.preferencias]: bruto });
      expect(await repositorio.obterJanelaDeLembretes()).toEqual(JANELA_PADRAO);
    });
  }
});

test('a hora 0 e o minuto 0 são válidos, não confundidos com ausência', async () => {
  const meiaNoite: JanelaDeLembretes = { inicio: { hora: 0, minuto: 0 }, fim: { hora: 23, minuto: 59 } };
  const { armazenamento, repositorio } = montar();
  await repositorio.definirJanelaDeLembretes(meiaNoite);

  expect(await new RepositorioDePreferenciasAsyncStorage(armazenamento).obterJanelaDeLembretes()).toEqual(meiaNoite);
});

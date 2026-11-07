import { AjustarPreferencias } from '@/aplicacao/casos-de-uso/AjustarPreferencias';
import { JANELA_PADRAO, JanelaDeLembretes } from '@/dominio/modelos/JanelaDeLembretes';
import { RepositorioDePreferenciasEmMemoria } from '../apoio/fakes';

const NOTURNA: JanelaDeLembretes = { inicio: { hora: 22, minuto: 30 }, fim: { hora: 7, minuto: 15 } };

test('na primeira execução, entrega a janela padrão', async () => {
  const caso = new AjustarPreferencias(new RepositorioDePreferenciasEmMemoria());
  expect(await caso.obterJanelaDeLembretes()).toEqual(JANELA_PADRAO);
});

test('a janela definida é a que volta na leitura seguinte', async () => {
  const caso = new AjustarPreferencias(new RepositorioDePreferenciasEmMemoria());
  await caso.definirJanelaDeLembretes(NOTURNA);
  expect(await caso.obterJanelaDeLembretes()).toEqual(NOTURNA);
});

test('grava só hora e minuto, sem campos extras que vierem no objeto', async () => {
  const preferencias = new RepositorioDePreferenciasEmMemoria();
  await new AjustarPreferencias(preferencias).definirJanelaDeLembretes({
    ...NOTURNA,
    inicio: { ...NOTURNA.inicio, segundo: 42 },
  } as JanelaDeLembretes);

  expect(preferencias.janelaGravada).toEqual(NOTURNA);
});

describe('horário fora da faixa é recusado, em vez de voltar calado ao padrão', () => {
  const casos: readonly [string, JanelaDeLembretes][] = [
    ['hora acima de 23', { inicio: { hora: 24, minuto: 0 }, fim: { hora: 9, minuto: 0 } }],
    ['hora negativa', { inicio: { hora: -1, minuto: 0 }, fim: { hora: 9, minuto: 0 } }],
    ['minuto acima de 59', { inicio: { hora: 8, minuto: 60 }, fim: { hora: 9, minuto: 0 } }],
    ['hora fracionada', { inicio: { hora: 8.5, minuto: 0 }, fim: { hora: 9, minuto: 0 } }],
    ['fim inválido', { inicio: { hora: 8, minuto: 0 }, fim: { hora: 9, minuto: 99 } }],
  ];

  for (const [descricao, janela] of casos) {
    test(descricao, async () => {
      const preferencias = new RepositorioDePreferenciasEmMemoria();
      await expect(new AjustarPreferencias(preferencias).definirJanelaDeLembretes(janela)).rejects.toThrow(
        /Horário inválido/,
      );
      expect(preferencias.janelaGravada).toEqual(JANELA_PADRAO);
    });
  }
});

test('a falha de gravação chega a quem chama: a tela precisa poder avisar', async () => {
  const caso = new AjustarPreferencias(new RepositorioDePreferenciasEmMemoria(JANELA_PADRAO, false, true));
  await expect(caso.definirJanelaDeLembretes(NOTURNA)).rejects.toThrow('armazenamento indisponível');
});

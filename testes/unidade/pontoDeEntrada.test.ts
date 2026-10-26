import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(__dirname, '../..');
const pacote = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8')) as { main: string };

function importacoesDaEntrada(): string[] {
  const codigo = fs.readFileSync(path.join(RAIZ, pacote.main), 'utf8');
  return [...codigo.matchAll(/^import\s+['"]([^'"]+)['"]/gm)].map((achado) => achado[1]);
}

// Quando o Android acorda o app sem tela para a verificação periódica, só o ponto de entrada roda: as rotas
// (e o app/_layout.tsx) não carregam. A tarefa precisa estar definida antes disso, ou o Android a procura e
// não encontra ("No task registered for key expo-task-manager").
test('o ponto de entrada é um arquivo do projeto, e não o do expo-router', () => {
  expect(pacote.main).not.toBe('expo-router/entry');
  expect(fs.existsSync(path.join(RAIZ, pacote.main))).toBe(true);
});

test('o ponto de entrada define a tarefa de segundo plano antes de carregar o roteador', () => {
  const importacoes = importacoesDaEntrada();
  const tarefa = importacoes.findIndex((origem) => origem.endsWith('composicao/verificacaoEmSegundoPlano'));
  const roteador = importacoes.indexOf('expo-router/entry');
  expect(tarefa).toBeGreaterThanOrEqual(0);
  expect(roteador).toBeGreaterThan(tarefa);
});

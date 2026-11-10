import fs from 'node:fs';
import path from 'node:path';
import { TEXTOS } from '@/textos';

const RAIZ = path.resolve(__dirname, '../..');

function arquivosDe(pasta: string): string[] {
  return fs.readdirSync(path.join(RAIZ, pasta), { withFileTypes: true }).flatMap((entrada) => {
    const relativo = path.join(pasta, entrada.name);
    if (entrada.isDirectory()) return arquivosDe(relativo);
    return entrada.name.endsWith('.tsx') ? [relativo] : [];
  });
}

/** Cada texto do módulo, com as funções chamadas com valores de exemplo. */
function todosOsTextos(valor: unknown): string[] {
  if (typeof valor === 'string') return [valor];
  if (typeof valor === 'function') {
    const exemplos = Array.from({ length: valor.length }, (_, indice) => (indice === 0 ? 'X' : 2));
    return todosOsTextos((valor as (...argumentos: unknown[]) => unknown)(...exemplos));
  }
  if (Array.isArray(valor)) return valor.flatMap(todosOsTextos);
  if (typeof valor === 'object' && valor !== null) return Object.values(valor).flatMap(todosOsTextos);
  return [];
}

test('as telas não escrevem texto direto: tudo vem do módulo de textos', () => {
  const PROPRIEDADES_DE_TEXTO = /\b(titulo|descricao|rotulo|accessibilityLabel|accessibilityHint|placeholder)="[^"]*[A-Za-zÀ-ú]{2,}[^"]*"/;
  const TEXTO_NO_JSX = />\s*[A-Za-zÀ-ú✓][^<>{}]*<\//;
  const achados = [...arquivosDe('src/apresentacao'), ...arquivosDe('app')].flatMap((arquivo) => {
    const codigo = fs.readFileSync(path.join(RAIZ, arquivo), 'utf8').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
    return codigo
      .split('\n')
      .map((linha, indice) => ({ linha: linha.trim(), numero: indice + 1 }))
      .filter(({ linha }) => !linha.startsWith('//') && !linha.startsWith('*'))
      .filter(({ linha }) => PROPRIEDADES_DE_TEXTO.test(linha) || TEXTO_NO_JSX.test(linha))
      .map(({ linha, numero }) => `${arquivo}:${numero}: ${linha}`);
  });
  expect(achados).toEqual([]);
});

test('nenhum texto usa termo técnico do projeto', () => {
  const JARGAO = /\b(hardware|development build|expo go|grandezas?|desvios?|cache|rssi|ble|associad[oa]s?|associar|desassociar|monitorad[oa])\b/i;
  expect(todosOsTextos(TEXTOS).filter((texto) => JARGAO.test(texto))).toEqual([]);
});

test('o lux, a unidade de luz, é explicado na tela das condições', () => {
  expect(TEXTOS.condicoes.explicacaoDoLux).toMatch(/^Lux mede quanta luz chega à planta/);
});

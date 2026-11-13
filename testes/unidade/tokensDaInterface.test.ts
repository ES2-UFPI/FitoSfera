import fs from 'node:fs';
import path from 'node:path';
import * as tema from '@/apresentacao/tema';

/**
 * US07 (#40): existe um módulo único de tokens (`src/apresentacao/tema`), usado pelas telas, e nenhuma tela define
 * cor ou espaçamento com valor literal fora dele. Uma tela nova que escrever `gap: 6` ou `'#FFF'` reprova o CI.
 */

const RAIZ = path.resolve(__dirname, '../..');
const TEMA = path.join('src', 'apresentacao', 'tema');
/** As cores dos desenhos das plantas são uma paleta própria, com dezenas de tons que nenhuma tela usa. */
const PALETA_DOS_DESENHOS = path.join('src', 'apresentacao', 'ilustracao', 'paletas.ts');

function arquivosDe(pasta: string): string[] {
  return fs.readdirSync(path.join(RAIZ, pasta), { withFileTypes: true }).flatMap((entrada) => {
    const relativo = path.join(pasta, entrada.name);
    if (entrada.isDirectory()) return relativo === TEMA ? [] : arquivosDe(relativo);
    return /\.tsx?$/.test(entrada.name) ? [relativo] : [];
  });
}

const ARQUIVOS = [...arquivosDe(path.join('src', 'apresentacao')), ...arquivosDe('app')];

/** Cada linha de código, sem comentários, com o arquivo e o número, para a mensagem de erro apontar o lugar. */
function linhasDeCodigo(arquivo: string): { linha: string; onde: string }[] {
  return fs
    .readFileSync(path.join(RAIZ, arquivo), 'utf8')
    .split(/\r?\n/)
    .map((linha, indice) => ({ linha: linha.replace(/\/\/.*$/, ''), onde: `${arquivo}:${indice + 1}` }))
    .filter(({ linha }) => !/^\s*(\*|\/\*\*?)/.test(linha));
}

function procurar(padrao: RegExp, arquivos = ARQUIVOS): string[] {
  return arquivos.flatMap((arquivo) =>
    linhasDeCodigo(arquivo)
      .filter(({ linha }) => padrao.test(linha))
      .map(({ linha, onde }) => `${onde}: ${linha.trim()}`),
  );
}

test('existe um módulo único de tokens, que reúne cores, tipografia e medidas', () => {
  expect(Object.keys(tema)).toEqual(expect.arrayContaining(['CORES', 'FONTES', 'TEXTO', 'ESPACO', 'RAIO', 'ALVO_DE_TOQUE']));
});

test('as telas importam os tokens do módulo único, nunca dos arquivos internos do tema', () => {
  expect(procurar(/from '[^']*tema\/(cores|medidas|tipografia)'/)).toEqual([]);
});

test('nenhuma tela define cor com valor literal', () => {
  const COR_LITERAL = /#[0-9A-Fa-f]{3,8}\b|\brgba?\(|\bhsla?\(|['"](white|black|red|green|blue|gray|grey)['"]/;
  expect(procurar(COR_LITERAL, ARQUIVOS.filter((arquivo) => arquivo !== PALETA_DOS_DESENHOS))).toEqual([]);
});

test('nenhuma tela define espaçamento ou raio com número solto', () => {
  // `padding: 0` é ausência de espaço, não um valor a padronizar.
  const ESPACAMENTO_LITERAL =
    /\b(padding|margin|gap|rowGap|columnGap)(Top|Bottom|Left|Right|Horizontal|Vertical|Start|End)?\s*:\s*-?(?!0\b)\d|\bborder(Top|Bottom)?(Left|Right)?Radius\s*:\s*(?!0\b)\d/;
  expect(procurar(ESPACAMENTO_LITERAL)).toEqual([]);
});

test('nenhuma tela soma um número solto a um token, como ESPACO.medio + 2', () => {
  expect(procurar(/\b(ESPACO|RAIO)\.\w+\s*[+-]\s*\d/)).toEqual([]);
});

test('larguras máximas de conteúdo, modal e leitura também vêm dos tokens', () => {
  expect(procurar(/\bmaxWidth\s*:\s*\d/)).toEqual([]);
});

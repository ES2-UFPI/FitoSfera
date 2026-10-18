import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(__dirname, '../../src');

function arquivosDe(pasta: string): string[] {
  return fs.readdirSync(path.join(RAIZ, pasta), { withFileTypes: true }).flatMap((entrada) => {
    const relativo = path.join(pasta, entrada.name);
    if (entrada.isDirectory()) return arquivosDe(relativo);
    return /\.tsx?$/.test(entrada.name) ? [relativo] : [];
  });
}

function importacoes(arquivo: string): string[] {
  const codigo = fs.readFileSync(path.join(RAIZ, arquivo), 'utf8');
  return [...codigo.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)].map((achado) => achado[1]);
}

test('o domínio só importa do próprio domínio: nada de Expo, React Native, BLE ou AsyncStorage', () => {
  const proibidas = arquivosDe('dominio').flatMap((arquivo) =>
    importacoes(arquivo)
      .filter((origem) => !origem.startsWith('.') && !origem.startsWith('@/dominio/'))
      .map((origem) => `${arquivo} importa ${origem}`),
  );
  expect(proibidas).toEqual([]);
});

test('a porta do sensor está no domínio', () => {
  expect(fs.existsSync(path.join(RAIZ, 'dominio/portas/SensorDeAmbiente.ts'))).toBe(true);
});

test('aplicação e apresentação não conhecem a infraestrutura: só o container escolhe o sensor', () => {
  const acoplamentos = [...arquivosDe('aplicacao'), ...arquivosDe('apresentacao')].flatMap((arquivo) =>
    importacoes(arquivo)
      .filter((origem) => origem.startsWith('@/infraestrutura/'))
      .map((origem) => `${arquivo} importa ${origem}`),
  );
  expect(acoplamentos).toEqual([]);
});

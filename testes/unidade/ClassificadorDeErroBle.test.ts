import { classificarErroBle, CODIGOS_DO_BLE } from '@/infraestrutura/sensores/ClassificadorDeErroBle';
import { FalhaBle } from '@/infraestrutura/sensores/ClienteBle';

const erroDaBiblioteca = (errorCode: number) => Object.assign(new Error('BleError'), { errorCode });

test.each([
  [CODIGOS_DO_BLE.bluetoothDesligado, 'bluetooth-desligado'],
  [CODIGOS_DO_BLE.semPermissao, 'sem-permissao'],
  [CODIGOS_DO_BLE.localizacaoDesligada, 'sem-permissao'],
  [CODIGOS_DO_BLE.tempoEsgotado, 'tempo-esgotado'],
  [CODIGOS_DO_BLE.falhaAoConectar, 'fora-de-alcance'],
  [CODIGOS_DO_BLE.dispositivoDesconectado, 'fora-de-alcance'],
  [CODIGOS_DO_BLE.dispositivoNaoEncontrado, 'fora-de-alcance'],
  [CODIGOS_DO_BLE.falhaAoDescobrirServicos, 'falha-na-leitura'],
  [CODIGOS_DO_BLE.falhaAoLer, 'falha-na-leitura'],
  [CODIGOS_DO_BLE.operacaoCancelada, 'desconhecido'],
])('o código %i da biblioteca vira "%s"', (codigo, tipo) => {
  expect(classificarErroBle(erroDaBiblioteca(codigo)).tipo).toBe(tipo);
});

test('guarda o erro original como causa, para quem for depurar', () => {
  const original = erroDaBiblioteca(CODIGOS_DO_BLE.tempoEsgotado);
  expect(classificarErroBle(original).cause).toBe(original);
});

test('erro sem código, ou que nem é objeto, vira "desconhecido"', () => {
  expect(classificarErroBle(new Error('qualquer')).tipo).toBe('desconhecido');
  expect(classificarErroBle('texto').tipo).toBe('desconhecido');
  expect(classificarErroBle(null).tipo).toBe('desconhecido');
});

test('um FalhaBle já classificado passa como está', () => {
  const falha = new FalhaBle('fora-de-alcance');
  expect(classificarErroBle(falha)).toBe(falha);
});

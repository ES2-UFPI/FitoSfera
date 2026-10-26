import { ArmazenamentoEmMemoria } from '../apoio/ArmazenamentoEmMemoria';
import { RelogioParado } from '../apoio/fakes';

// A biblioteca BLE nativa não existe nos testes; um cliente vazio basta para montar a central.
jest.mock('@/infraestrutura/sensores/ClienteBlePlx', () => ({
  bluetoothDisponivel: () => true,
  ClienteBlePlx: class {
    async pedirPermissoes() { return true; }
    async temPermissoes() { return true; }
    async consultarEstado() { return 'ligado'; }
    observarEstado() { return () => undefined; }
    procurar() { return () => undefined; }
    async conectar() { throw new Error('sem sensor nos testes'); }
  },
}));

import { criarSensorBluetooth } from '@/composicao/criarSensorBluetooth';

// O app e a tarefa de segundo plano montam cada um o seu container; com uma central por container, a tarefa
// abriria uma segunda conexão com um sensor que aceita uma só e nunca teria leitura.
test('a central de sensores Bluetooth é uma só por processo, mesmo com vários containers', () => {
  const primeira = criarSensorBluetooth(new ArmazenamentoEmMemoria(), new RelogioParado());
  const segunda = criarSensorBluetooth(new ArmazenamentoEmMemoria(), new RelogioParado());
  expect(primeira).not.toBeNull();
  expect(segunda).toBe(primeira);
});

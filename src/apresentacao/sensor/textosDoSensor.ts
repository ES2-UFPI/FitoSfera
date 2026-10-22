import { MotivoDaFalhaDoPareamento, SensorEncontrado } from '@/aplicacao/portas/PareamentoDoSensor';
import { Leitura } from '@/dominio/modelos/Leitura';

export const MENSAGEM_DA_FALHA: Record<MotivoDaFalhaDoPareamento, string> = {
  'permissao-negada': 'Sem a permissão de Bluetooth, o app não consegue procurar o sensor.',
  'bluetooth-desligado': 'O Bluetooth do celular está desligado. Ligue e tente de novo.',
  'falha-na-busca': 'A busca parou de funcionar. Tente procurar de novo.',
  'falha-na-conexao': 'Não deu para conectar. Confira se o sensor está ligado e perto do celular.',
  'sem-leitura': 'O sensor conectou, mas não mandou leitura. Confira os fios do sensor de temperatura.',
};

/** Todos se chamam "FitoSfera": o final do endereço é o que diferencia um do outro. */
export function finalDoEndereco(id: string): string {
  return id.replace(/[^0-9a-f]/gi, '').slice(-4).toUpperCase();
}

export function descreverSinal(intensidade: number | null): string {
  if (intensidade === null) return 'sinal desconhecido';
  if (intensidade >= -60) return 'sinal forte';
  return intensidade >= -80 ? 'sinal médio' : 'sinal fraco';
}

export function ordenarPorSinal(sensores: Iterable<SensorEncontrado>): SensorEncontrado[] {
  return [...sensores].sort((a, b) => (b.intensidadeDoSinal ?? -999) - (a.intensidadeDoSinal ?? -999));
}

function numero(valor: number, casas: number): string {
  return valor.toFixed(casas).replace('.', ',');
}

export function resumirLeitura(leitura: Leitura): string {
  const luz = leitura.luminosidadeLux === null ? 'sem leitura de luz' : `${leitura.luminosidadeLux} lux`;
  return `${numero(leitura.temperaturaCelsius, 1)} °C · ${numero(leitura.umidadePercentual, 0)}% de umidade · ${luz}`;
}

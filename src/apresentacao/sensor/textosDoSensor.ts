import { MotivoDaFalhaDoPareamento, SensorEncontrado } from '@/aplicacao/portas/PareamentoDoSensor';
import { ProblemaDaConexao } from '@/dominio/modelos/EstadoDaConexao';
import { Leitura } from '@/dominio/modelos/Leitura';

/** O que aconteceu, em linguagem simples, e o que a pessoa pode fazer: uma mensagem por motivo, nenhuma genérica. */
export const MENSAGEM_DA_FALHA: Record<MotivoDaFalhaDoPareamento, { titulo: string; acao: string }> = {
  'permissao-negada': {
    titulo: 'O app não tem permissão para usar o Bluetooth.',
    acao: 'Abra as configurações, permita "Dispositivos próximos" (ou "Localização", em celulares mais antigos) e volte aqui.',
  },
  'bluetooth-desligado': {
    titulo: 'O Bluetooth do celular está desligado.',
    acao: 'Ligue o Bluetooth no painel de atalhos do celular e toque em "Tentar de novo".',
  },
  'falha-na-busca': {
    titulo: 'A busca por sensores parou no meio.',
    acao: 'Toque em "Tentar de novo" para procurar outra vez.',
  },
  'fora-de-alcance': {
    titulo: 'O sensor não respondeu.',
    acao: 'Confira se ele está ligado na tomada, aproxime o celular e veja se nenhum outro celular está conectado a ele.',
  },
  'tempo-esgotado': {
    titulo: 'O sensor demorou demais para responder.',
    acao: 'Deixe o celular a menos de um cômodo de distância do sensor e tente de novo.',
  },
  'falha-na-leitura': {
    titulo: 'O app achou o sensor, mas não conseguiu conversar com ele.',
    acao: 'Tire o sensor da tomada, ligue de novo, espere alguns segundos e tente outra vez.',
  },
  'falha-na-conexao': {
    titulo: 'Não deu para conectar ao sensor.',
    acao: 'Confira se ele está ligado e perto do celular e tente de novo.',
  },
  'sem-leitura': {
    titulo: 'O sensor conectou, mas não mandou nenhuma leitura.',
    acao: 'Confira os fios do sensor de temperatura e umidade e tente de novo.',
  },
};

/** O motivo de uma desconexão durante o uso, para o indicador de conexão. */
export const MENSAGEM_DO_PROBLEMA: Record<ProblemaDaConexao, string> = {
  'bluetooth-desligado': 'O Bluetooth do celular está desligado. Ligue para o app voltar a receber leituras',
  'fora-de-alcance': 'O sensor está fora de alcance. Confira se ele está ligado e perto do celular',
  'tempo-esgotado': 'O sensor demorou demais para responder. Aproxime o celular do sensor',
  'falha-na-leitura': 'O sensor não respondeu como deveria. Se continuar, tire da tomada e ligue de novo',
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

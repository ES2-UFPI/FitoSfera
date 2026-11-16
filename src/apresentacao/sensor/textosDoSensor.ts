import { MotivoDaFalhaDoPareamento, SensorEncontrado } from '@/aplicacao/portas/PareamentoDoSensor';
import { ProblemaDaConexao } from '@/dominio/modelos/EstadoDaConexao';
import { Leitura } from '@/dominio/modelos/Leitura';
import { TEXTOS } from '@/textos';

/** O que aconteceu, em linguagem simples, e o que a pessoa pode fazer: uma mensagem por motivo, nenhuma genérica. */
export const MENSAGEM_DA_FALHA: Record<MotivoDaFalhaDoPareamento, { titulo: string; acao: string }> =
  TEXTOS.pareamento.falhas;

/** O motivo de uma desconexão durante o uso, para o indicador de conexão. */
export const MENSAGEM_DO_PROBLEMA: Record<ProblemaDaConexao, string> = TEXTOS.conexao.problemas;

/** Todos se chamam "FitoSfera": o final do endereço é o que diferencia um do outro. */
export function finalDoEndereco(id: string): string {
  return id.replace(/[^0-9a-f]/gi, '').slice(-4).toUpperCase();
}

export function descreverSinal(intensidade: number | null): string {
  if (intensidade === null) return TEXTOS.sensor.sinalDesconhecido;
  if (intensidade >= -60) return TEXTOS.sensor.sinalForte;
  return intensidade >= -80 ? TEXTOS.sensor.sinalMedio : TEXTOS.sensor.sinalFraco;
}

export function ordenarPorSinal(sensores: Iterable<SensorEncontrado>): SensorEncontrado[] {
  return [...sensores].sort((a, b) => (b.intensidadeDoSinal ?? -999) - (a.intensidadeDoSinal ?? -999));
}

function numero(valor: number, casas: number): string {
  return valor.toFixed(casas).replace('.', ',');
}

export function resumirLeitura(leitura: Leitura): string {
  const luz =
    leitura.luminosidadeLux === null ? TEXTOS.sensor.semLeituraDeLuz : TEXTOS.sensor.luxMedidos(leitura.luminosidadeLux);
  return TEXTOS.sensor.resumoDaLeitura(numero(leitura.temperaturaCelsius, 1), numero(leitura.umidadePercentual, 0), luz);
}

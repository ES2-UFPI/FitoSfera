import { Desvio, Grandeza } from '../regras/DesvioDaLeitura';

/** O texto de uma notificação de desvio. */
export interface MensagemDoAviso {
  readonly titulo: string;
  readonly corpo: string;
}

/** O nome de cada grandeza na frase e a unidade colada ao número (a unidade já traz o espaço, quando tem). */
const TEXTO_DA_GRANDEZA: Record<Grandeza, { readonly nome: string; readonly unidade: string }> = {
  umidadeDoAr: { nome: 'A umidade do ar', unidade: '%' },
  temperatura: { nome: 'A temperatura', unidade: ' °C' },
  luminosidade: { nome: 'A luminosidade', unidade: ' lux' },
};

/**
 * Monta o aviso que a pessoa lê na notificação, uma frase curta por desvio. O texto mantém o valor medido,
 * mas deixa os limites detalhados para o painel da planta.
 */
export function montarMensagemDoAviso(apelido: string, desvios: readonly Desvio[]): MensagemDoAviso {
  return {
    titulo: `${apelido} precisa de atenção`,
    corpo: desvios.map(descreverDesvio).join(' '),
  };
}

function descreverDesvio(desvio: Desvio): string {
  const { nome, unidade } = TEXTO_DA_GRANDEZA[desvio.grandeza];
  const medido = comUnidade(desvio.valor, unidade);
  return `${nome} está em ${medido}, ${desvio.sentido} do ideal.`;
}

/** Uma casa decimal basta para a pessoa, e com vírgula, como se escreve em português. */
function comUnidade(valor: number, unidade: string): string {
  return `${String(Math.round(valor * 10) / 10).replace('.', ',')}${unidade}`;
}

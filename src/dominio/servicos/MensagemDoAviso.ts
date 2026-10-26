import { Desvio, Grandeza, SentidoDoDesvio } from '../regras/DesvioDaLeitura';

/** O texto de uma notificação de desvio. */
export interface MensagemDoAviso {
  readonly titulo: string;
  readonly corpo: string;
}

/** O que a pessoa precisa fazer, da ação mais urgente para a menos. */
export const ACOES = ['aguar', 'afastar do sol', 'reposicionar'] as const;
export type Acao = (typeof ACOES)[number];

/** Como cada ação entra no título, sempre depois do apelido da planta. */
const PEDIDO_DA_ACAO: Record<Acao, string> = {
  aguar: 'precisa de água',
  'afastar do sol': 'precisa sair do sol',
  reposicionar: 'precisa mudar de lugar',
};

/**
 * A ação que resolve cada tipo de desvio. Só a falta de umidade se resolve com água; o calor demais pede
 * sombra; o resto — ar úmido, frio e luz fora do ideal — se resolve mudando a planta de lugar.
 */
const ACAO_DO_DESVIO: Record<Grandeza, Record<SentidoDoDesvio, Acao>> = {
  umidadeDoAr: { abaixo: 'aguar', acima: 'reposicionar' },
  temperatura: { abaixo: 'reposicionar', acima: 'afastar do sol' },
  luminosidade: { abaixo: 'reposicionar', acima: 'reposicionar' },
};

/** O nome de cada grandeza na frase e a unidade colada ao número (a unidade já traz o espaço, quando tem). */
const TEXTO_DA_GRANDEZA: Record<Grandeza, { readonly nome: string; readonly unidade: string }> = {
  umidadeDoAr: { nome: 'A umidade do ar', unidade: '%' },
  temperatura: { nome: 'A temperatura', unidade: ' °C' },
  luminosidade: { nome: 'A luminosidade', unidade: ' lux' },
};

export function acaoDoDesvio(desvio: Desvio): Acao {
  return ACAO_DO_DESVIO[desvio.grandeza][desvio.sentido];
}

/**
 * A ação que vai para o título quando a planta tem mais de um desvio: a mais urgente, na ordem de `ACOES`.
 * Uma planta seca e no sol forte precisa de água antes de precisar de sombra. Null sem nenhum desvio.
 */
export function acaoPrincipal(desvios: readonly Desvio[]): Acao | null {
  const acoes = new Set(desvios.map(acaoDoDesvio));
  return ACOES.find((acao) => acoes.has(acao)) ?? null;
}

/**
 * Monta o aviso que a pessoa lê na notificação. O título diz de quem é e o que fazer, em linguagem simples
 * e sem número nenhum; o corpo é que explica o porquê, uma frase curta por desvio, com o valor medido.
 * Os limites da faixa ficam para o painel da planta.
 */
export function montarMensagemDoAviso(apelido: string, desvios: readonly Desvio[]): MensagemDoAviso {
  const acao = acaoPrincipal(desvios);
  return {
    titulo: `${apelido} ${acao === null ? 'precisa de atenção' : PEDIDO_DA_ACAO[acao]}`,
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

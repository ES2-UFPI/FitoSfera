import type { ExigenciasDeManejo, FatoDeManejo } from '@/dominio/modelos/ExigenciasDeManejo';

/** Os três fatos, na ordem em que o protocolo de resposta os apresenta. */
export const FATOS_DE_MANEJO = ['exigeControleDePraga', 'morreComEncharcamento', 'exigeManejoEstrutural'] as const;

type Registro = Record<string, unknown>;

const ehRegistro = (valor: unknown): valor is Registro =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor);
const ehTextoPreenchido = (valor: unknown): valor is string => typeof valor === 'string' && valor.trim() !== '';

/**
 * Confere o arquivo de fichas de manejo e devolve um erro por linha. Lista vazia quer dizer arquivo válido.
 *
 * Uma ficha só entra aqui completa: os três fatos respondidos e cada um com a publicação consultada. Meia
 * ficha seria pior que ficha nenhuma, porque um fato em branco conta como "não" e baixa a dificuldade sem
 * ninguém ter lido a fonte. Espécie ainda sem ficha simplesmente não aparece no arquivo, e
 * `idsSemFichaDeManejo` é quem lista essas pendências.
 */
export function validarExigenciasDeManejo(dados: unknown, idsDoCatalogo: readonly string[]): string[] {
  if (!ehRegistro(dados)) return ['as fichas de manejo precisam ser um objeto com um bloco por id de espécie'];

  const erros: string[] = [];
  const idsConhecidos = new Set(idsDoCatalogo);

  Object.entries(dados).forEach(([id, ficha]) => {
    const erro = (mensagem: string) => erros.push(`ficha de ${id}: ${mensagem}`);
    if (!idsConhecidos.has(id)) return erro('não existe espécie com esse id no catálogo');
    if (!ehRegistro(ficha)) return erro('não é um objeto');

    FATOS_DE_MANEJO.forEach((fato) => validarFato(ficha[fato], fato, erro));
  });

  return erros;
}

/** As espécies do catálogo que ainda não têm ficha: o que falta pesquisar nas fontes. */
export function idsSemFichaDeManejo(dados: unknown, idsDoCatalogo: readonly string[]): string[] {
  const respondidos = ehRegistro(dados) ? new Set(Object.keys(dados)) : new Set<string>();
  return idsDoCatalogo.filter((id) => !respondidos.has(id));
}

/** Lê a ficha de uma espécie, ou null quando ela ainda não foi pesquisada. */
export function fichaDeManejo(dados: unknown, id: string): ExigenciasDeManejo | null {
  if (!ehRegistro(dados)) return null;
  const ficha = dados[id];
  if (!ehRegistro(ficha)) return null;
  if (!FATOS_DE_MANEJO.every((fato) => ehFatoDeManejo(ficha[fato]))) return null;
  return ficha as unknown as ExigenciasDeManejo;
}

const ehFatoDeManejo = (valor: unknown): valor is FatoDeManejo =>
  ehRegistro(valor) && typeof valor.presente === 'boolean' && ehTextoPreenchido(valor.fonte);

function validarFato(fato: unknown, nome: string, erro: (mensagem: string) => void) {
  if (!ehRegistro(fato)) return erro(`${nome} é obrigatório, com presente e fonte`);
  if (typeof fato.presente !== 'boolean') erro(`${nome}.presente precisa ser true ou false`);
  if (!ehTextoPreenchido(fato.fonte)) erro(`${nome} precisa citar a publicação consultada em fonte`);
}

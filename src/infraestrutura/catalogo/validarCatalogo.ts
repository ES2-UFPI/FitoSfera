import { NIVEIS_DE_DIFICULDADE } from '@/dominio/modelos/EspecieVegetal';

const ID_EM_KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Limites do que faz sentido medir em casa; um valor fora disso é erro de digitação. */
const LIMITES_DAS_FAIXAS = {
  umidadeDoAr: { minimo: 0, maximo: 100 },
  temperatura: { minimo: -10, maximo: 50 },
  luminosidade: { minimo: 0, maximo: 120000 },
} as const;

type Registro = Record<string, unknown>;

const ehRegistro = (valor: unknown): valor is Registro =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor);
const ehTextoPreenchido = (valor: unknown): valor is string => typeof valor === 'string' && valor.trim() !== '';
const ehNumero = (valor: unknown): valor is number => typeof valor === 'number' && Number.isFinite(valor);
const ehInteiroPositivo = (valor: unknown): valor is number => Number.isInteger(valor) && (valor as number) > 0;

/**
 * Confere o catálogo inteiro e devolve um erro por linha, já dizendo a espécie e o campo.
 * Lista vazia quer dizer catálogo válido. Roda nos testes e, por eles, no CI.
 */
export function validarCatalogo(dados: unknown): string[] {
  if (!Array.isArray(dados)) return ['o catálogo precisa ser uma lista de espécies'];

  const erros: string[] = [];
  const idsVistos = new Set<string>();

  dados.forEach((especie, posicao) => {
    const erro = (mensagem: string) => erros.push(`${rotulo(especie, posicao)}: ${mensagem}`);
    if (!ehRegistro(especie)) return erro('não é um objeto');

    const { id, nomeComum, nomeCientifico, nomesAlternativos, foto, faixasIdeais } = especie;
    if (!ehTextoPreenchido(id) || !ID_EM_KEBAB_CASE.test(id)) erro('id precisa estar em kebab-case, como "capim-limao"');
    else if (idsVistos.has(id)) erro(`id "${id}" repetido`);
    else idsVistos.add(id);

    if (!ehTextoPreenchido(nomeComum)) erro('nomeComum é obrigatório');
    if (!ehTextoPreenchido(nomeCientifico)) erro('nomeCientifico é obrigatório');
    if (!Array.isArray(nomesAlternativos) || !nomesAlternativos.every(ehTextoPreenchido))
      erro('nomesAlternativos precisa ser uma lista de textos (pode ser vazia)');
    if (foto !== null && !ehTextoPreenchido(foto)) erro('foto precisa ser um caminho ou null');

    if (!ehRegistro(faixasIdeais)) erro('faixasIdeais é obrigatório');
    else
      (Object.keys(LIMITES_DAS_FAIXAS) as (keyof typeof LIMITES_DAS_FAIXAS)[]).forEach((grandeza) =>
        validarFaixa(faixasIdeais[grandeza], grandeza, erro),
      );

    if (!ehInteiroPositivo(especie.intervaloDeRegaEmDias)) erro('intervaloDeRegaEmDias precisa ser um inteiro positivo');
    if (!NIVEIS_DE_DIFICULDADE.includes(especie.nivelDeDificuldade as never))
      erro(`nivelDeDificuldade precisa ser um de: ${NIVEIS_DE_DIFICULDADE.join(', ')}`);
    validarCiclo(especie.cicloAteColheitaEmDias, erro);
  });

  return erros;
}

function validarFaixa(faixa: unknown, grandeza: keyof typeof LIMITES_DAS_FAIXAS, erro: (mensagem: string) => void) {
  const campo = `faixasIdeais.${grandeza}`;
  if (!ehRegistro(faixa)) return erro(`${campo} é obrigatória`);
  const { minimo, maximo, fonte } = faixa;
  if (!ehNumero(minimo) || !ehNumero(maximo)) return erro(`${campo} precisa de minimo e maximo numéricos`);
  if (minimo >= maximo) erro(`${campo} tem minimo (${minimo}) maior ou igual ao maximo (${maximo})`);
  const limites = LIMITES_DAS_FAIXAS[grandeza];
  if (minimo < limites.minimo || maximo > limites.maximo)
    erro(`${campo} precisa ficar entre ${limites.minimo} e ${limites.maximo}`);
  if (!ehTextoPreenchido(fonte)) erro(`${campo} precisa citar a fonte`);
}

function validarCiclo(ciclo: unknown, erro: (mensagem: string) => void) {
  if (ciclo === null) return;
  if (!ehRegistro(ciclo) || !ehInteiroPositivo(ciclo.minimo) || !ehInteiroPositivo(ciclo.maximo))
    return erro('cicloAteColheitaEmDias precisa ser null ou ter minimo e maximo inteiros positivos');
  if (ciclo.minimo > ciclo.maximo) erro('cicloAteColheitaEmDias tem minimo maior que o maximo');
}

function rotulo(especie: unknown, posicao: number): string {
  const id = ehRegistro(especie) && typeof especie.id === 'string' ? ` (${especie.id})` : '';
  return `espécie ${posicao + 1}${id}`;
}

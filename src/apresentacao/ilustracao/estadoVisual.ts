/**
 * Ponto de extensão do estado de cuidado da planta.
 *
 * Nesta versão não há medição, então o único estado é "sem dados". O estado já percorre o caminho
 * todo: `VasoNaEstante` recebe e repassa ao `DesenhoDaPlanta`. Quando o sensor existir, os novos
 * estados ("com sede": murcha; "pouca luz": pálida e inclinada; ver o mockup `decisao-final.html`)
 * entram neste tipo e no `switch` de `DesenhoDaPlanta`, e a estante passa o estado de cada planta.
 */
export type EstadoVisual = { readonly tipo: 'sem-dados' };

export const SEM_DADOS: EstadoVisual = { tipo: 'sem-dados' };

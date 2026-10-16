import { Aparencia, IdDestaque, IdFolhagem, IdForma, IdVaso } from '@/dominio/modelos/Aparencia';

/** Como cada id de aparência do domínio vira cor e nome na tela. */
export const FORMAS_VISUAIS: Record<IdForma, { nome: string; rotuloDestaque: string | null }> = {
  frutifera: { nome: 'Frutífera', rotuloDestaque: 'Frutos' },
  erva: { nome: 'Erva', rotuloDestaque: null },
  flor: { nome: 'Flor aberta', rotuloDestaque: 'Flores' },
  espiga: { nome: 'Espiga', rotuloDestaque: 'Flores' },
  rasteira: { nome: 'Rasteira', rotuloDestaque: 'Frutos' },
  pendente: { nome: 'Pendente', rotuloDestaque: null },
  ereta: { nome: 'Eretas', rotuloDestaque: 'Bordas' },
  suculenta: { nome: 'Suculenta', rotuloDestaque: 'Pontas' },
};

export const CORES_DAS_FOLHAGENS: Record<
  IdFolhagem,
  { nome: string; folha: string; folhaClara: string; haste: string }
> = {
  'verde-folha': { nome: 'Verde-folha', folha: '#5C9A4B', folhaClara: '#8DC77B', haste: '#4E7F3E' },
  'verde-escuro': { nome: 'Verde-escuro', folha: '#3E6E45', folhaClara: '#5E9466', haste: '#34603A' },
  menta: { nome: 'Menta', folha: '#55B08A', folhaClara: '#86D1AE', haste: '#3F8A6A' },
  salvia: { nome: 'Sálvia', folha: '#8FA58A', folhaClara: '#AFC3A6', haste: '#6E8466' },
  limao: { nome: 'Limão', folha: '#8DBF4A', folhaClara: '#B5DA7A', haste: '#6E9A38' },
  azulado: { nome: 'Azulado', folha: '#5F8F8A', folhaClara: '#8DB8B0', haste: '#4C7470' },
  oliva: { nome: 'Oliva', folha: '#7C8A3E', folhaClara: '#A3B060', haste: '#626E30' },
  roxo: { nome: 'Roxo', folha: '#7A4E7E', folhaClara: '#A57AA8', haste: '#5E3B61' },
};

export const CORES_DOS_DESTAQUES: Record<IdDestaque, { nome: string; cor: string }> = {
  vermelho: { nome: 'Vermelho', cor: '#D9553A' },
  laranja: { nome: 'Laranja', cor: '#EE8A3A' },
  amarelo: { nome: 'Amarelo', cor: '#F0B429' },
  rosa: { nome: 'Rosa', cor: '#E8849A' },
  lilas: { nome: 'Lilás', cor: '#9B87CF' },
  roxo: { nome: 'Roxo', cor: '#7B4FA8' },
  azul: { nome: 'Azul', cor: '#6A8FD8' },
  vinho: { nome: 'Vinho', cor: '#9E2F45' },
  creme: { nome: 'Creme', cor: '#F3E3C3' },
};

export const CORES_DOS_VASOS: Record<IdVaso, { nome: string; corpo: string; borda: string }> = {
  terracota: { nome: 'Terracota', corpo: '#B65A34', borda: '#CF6F43' },
  creme: { nome: 'Creme', corpo: '#D9CBB4', borda: '#E8DCC8' },
  azul: { nome: 'Azul', corpo: '#5B7FA3', borda: '#7398BC' },
  salvia: { nome: 'Sálvia', corpo: '#7F9C84', borda: '#98B39C' },
  grafite: { nome: 'Grafite', corpo: '#5A5F66', borda: '#737980' },
  mostarda: { nome: 'Mostarda', corpo: '#C99A2E', borda: '#DDB24A' },
};

/** Cores que não mudam com a aparência: brilho dos frutos, miolo das flores, sementes, sombra do vaso. */
export const CORES_FIXAS_DO_DESENHO = {
  brilho: '#FFFFFF',
  miolo: '#F6D27A',
  semente: '#FFE08A',
  sombra: '#000000',
} as const;

/** As cores da marca: verde das folhas e do caule, verde-claro dos circuitos, sol e gota. */
export const CORES_DA_LOGO = {
  verde: '#3E9C4A',
  circuito: '#7FC98A',
  sol: '#FBBC1E',
  gota: '#3FA9F5',
  brilho: '#FFFFFF',
} as const;

export interface CoresDaPlanta {
  folha: string;
  folhaClara: string;
  haste: string;
  destaque: string;
  corpoDoVaso: string;
  bordaDoVaso: string;
}

export function coresDaPlanta(aparencia: Aparencia): CoresDaPlanta {
  const folhagem = CORES_DAS_FOLHAGENS[aparencia.folhagem];
  const vaso = CORES_DOS_VASOS[aparencia.vaso];
  return {
    folha: folhagem.folha,
    folhaClara: folhagem.folhaClara,
    haste: folhagem.haste,
    destaque: CORES_DOS_DESTAQUES[aparencia.destaque].cor,
    corpoDoVaso: vaso.corpo,
    bordaDoVaso: vaso.borda,
  };
}

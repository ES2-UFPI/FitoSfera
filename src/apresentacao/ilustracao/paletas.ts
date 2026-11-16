import { Aparencia, IdDestaque, IdFolhagem, IdForma, IdVaso } from '@/dominio/modelos/Aparencia';
import { TEXTOS } from '@/textos';

/** Como cada id de aparência do domínio vira cor e nome na tela; os nomes ficam no módulo de textos. */
export const FORMAS_VISUAIS: Record<IdForma, { nome: string; rotuloDestaque: string | null }> =
  TEXTOS.aparencia.formas;

export const CORES_DAS_FOLHAGENS: Record<
  IdFolhagem,
  { nome: string; folha: string; folhaClara: string; haste: string }
> = {
  'verde-folha': { nome: TEXTOS.aparencia.folhagens['verde-folha'], folha: '#5C9A4B', folhaClara: '#8DC77B', haste: '#4E7F3E' },
  'verde-escuro': { nome: TEXTOS.aparencia.folhagens['verde-escuro'], folha: '#3E6E45', folhaClara: '#5E9466', haste: '#34603A' },
  menta: { nome: TEXTOS.aparencia.folhagens.menta, folha: '#55B08A', folhaClara: '#86D1AE', haste: '#3F8A6A' },
  salvia: { nome: TEXTOS.aparencia.folhagens.salvia, folha: '#8FA58A', folhaClara: '#AFC3A6', haste: '#6E8466' },
  limao: { nome: TEXTOS.aparencia.folhagens.limao, folha: '#8DBF4A', folhaClara: '#B5DA7A', haste: '#6E9A38' },
  azulado: { nome: TEXTOS.aparencia.folhagens.azulado, folha: '#5F8F8A', folhaClara: '#8DB8B0', haste: '#4C7470' },
  oliva: { nome: TEXTOS.aparencia.folhagens.oliva, folha: '#7C8A3E', folhaClara: '#A3B060', haste: '#626E30' },
  roxo: { nome: TEXTOS.aparencia.folhagens.roxo, folha: '#7A4E7E', folhaClara: '#A57AA8', haste: '#5E3B61' },
};

export const CORES_DOS_DESTAQUES: Record<IdDestaque, { nome: string; cor: string }> = {
  vermelho: { nome: TEXTOS.aparencia.destaques.vermelho, cor: '#D9553A' },
  laranja: { nome: TEXTOS.aparencia.destaques.laranja, cor: '#EE8A3A' },
  amarelo: { nome: TEXTOS.aparencia.destaques.amarelo, cor: '#F0B429' },
  rosa: { nome: TEXTOS.aparencia.destaques.rosa, cor: '#E8849A' },
  lilas: { nome: TEXTOS.aparencia.destaques.lilas, cor: '#9B87CF' },
  roxo: { nome: TEXTOS.aparencia.destaques.roxo, cor: '#7B4FA8' },
  azul: { nome: TEXTOS.aparencia.destaques.azul, cor: '#6A8FD8' },
  vinho: { nome: TEXTOS.aparencia.destaques.vinho, cor: '#9E2F45' },
  creme: { nome: TEXTOS.aparencia.destaques.creme, cor: '#F3E3C3' },
};

export const CORES_DOS_VASOS: Record<IdVaso, { nome: string; corpo: string; borda: string }> = {
  terracota: { nome: TEXTOS.aparencia.vasos.terracota, corpo: '#B65A34', borda: '#CF6F43' },
  creme: { nome: TEXTOS.aparencia.vasos.creme, corpo: '#D9CBB4', borda: '#E8DCC8' },
  azul: { nome: TEXTOS.aparencia.vasos.azul, corpo: '#5B7FA3', borda: '#7398BC' },
  salvia: { nome: TEXTOS.aparencia.vasos.salvia, corpo: '#7F9C84', borda: '#98B39C' },
  grafite: { nome: TEXTOS.aparencia.vasos.grafite, corpo: '#5A5F66', borda: '#737980' },
  mostarda: { nome: TEXTOS.aparencia.vasos.mostarda, corpo: '#C99A2E', borda: '#DDB24A' },
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

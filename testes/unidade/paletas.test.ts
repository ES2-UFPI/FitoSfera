import {
  CORES_DAS_FOLHAGENS,
  CORES_DOS_DESTAQUES,
  CORES_DOS_VASOS,
  coresDaPlanta,
  FORMAS_VISUAIS,
} from '@/apresentacao/ilustracao/paletas';
import { APARENCIA_INICIAL, DESTAQUES, FOLHAGENS, FORMAS, VASOS } from '@/dominio/modelos/Aparencia';

const HEX = /^#[0-9A-F]{6}$/;

test('toda forma, folhagem, destaque e vaso do domínio tem entrada visual com hex válido', () => {
  FORMAS.forEach((forma) => expect(FORMAS_VISUAIS[forma].nome).not.toBe(''));
  FOLHAGENS.forEach((id) => {
    const { folha, folhaClara, haste } = CORES_DAS_FOLHAGENS[id];
    [folha, folhaClara, haste].forEach((cor) => expect(cor).toMatch(HEX));
  });
  DESTAQUES.forEach((id) => expect(CORES_DOS_DESTAQUES[id].cor).toMatch(HEX));
  VASOS.forEach((id) => {
    expect(CORES_DOS_VASOS[id].corpo).toMatch(HEX);
    expect(CORES_DOS_VASOS[id].borda).toMatch(HEX);
  });
});

test('rótulo do destaque por forma', () => {
  expect(Object.fromEntries(FORMAS.map((forma) => [forma, FORMAS_VISUAIS[forma].rotuloDestaque]))).toEqual({
    frutifera: 'Frutos',
    erva: null,
    flor: 'Flores',
    espiga: 'Flores',
    rasteira: 'Frutos',
    pendente: null,
    ereta: 'Bordas',
    suculenta: 'Pontas',
  });
});

test('cores da aparência inicial', () => {
  expect(coresDaPlanta(APARENCIA_INICIAL)).toEqual({
    folha: '#5C9A4B',
    folhaClara: '#8DC77B',
    haste: '#4E7F3E',
    destaque: '#D9553A',
    corpoDoVaso: '#B65A34',
    bordaDoVaso: '#CF6F43',
  });
});

test('cores de uma aparência escolhida pela pessoa', () => {
  expect(coresDaPlanta({ forma: 'flor', folhagem: 'roxo', destaque: 'azul', vaso: 'mostarda' })).toEqual({
    folha: '#7A4E7E',
    folhaClara: '#A57AA8',
    haste: '#5E3B61',
    destaque: '#6A8FD8',
    corpoDoVaso: '#C99A2E',
    bordaDoVaso: '#DDB24A',
  });
});

import catalogo from '@/infraestrutura/catalogo/catalogo-plantas.json';
import fichas from '@/infraestrutura/catalogo/exigencias-de-manejo.json';
import {
  fichaDeManejo,
  idsSemFichaDeManejo,
  validarExigenciasDeManejo,
} from '@/infraestrutura/catalogo/validarExigenciasDeManejo';

const IDS_DO_CATALOGO = catalogo.map((especie) => especie.id);
const FONTE = 'Embrapa Hortaliças, sistemas de produção';
const fato = (presente: boolean) => ({ presente, fonte: FONTE });
const fichaCompleta = {
  exigeControleDePraga: fato(true),
  morreComEncharcamento: fato(false),
  exigeManejoEstrutural: fato(true),
};

// O CI roda junto com a validação do catálogo: ficha incompleta reprova o pull request.
describe('exigencias-de-manejo.json', () => {
  test('passa na validação', () => {
    expect(validarExigenciasDeManejo(fichas, IDS_DO_CATALOGO)).toEqual([]);
  });

  test('só tem id que existe no catálogo', () => {
    const desconhecidos = Object.keys(fichas).filter((id) => !IDS_DO_CATALOGO.includes(id));
    expect(desconhecidos).toEqual([]);
  });

  test('cobre o catálogo menos o boldo, que ainda não foi pesquisado', () => {
    // Fica como lembrete: quando a ficha do boldo entrar, este teste cobra a atualização da lista.
    expect(idsSemFichaDeManejo(fichas, IDS_DO_CATALOGO)).toEqual(['boldo']);
  });
});

describe('validarExigenciasDeManejo', () => {
  test('aceita o arquivo vazio: espécie sem ficha é pendência, não erro', () => {
    expect(validarExigenciasDeManejo({}, IDS_DO_CATALOGO)).toEqual([]);
  });

  test('aceita uma ficha com os três fatos respondidos e com fonte', () => {
    expect(validarExigenciasDeManejo({ tomate: fichaCompleta }, IDS_DO_CATALOGO)).toEqual([]);
  });

  test('reprova o que não é objeto', () => {
    expect(validarExigenciasDeManejo([], IDS_DO_CATALOGO)).toEqual([
      'as fichas de manejo precisam ser um objeto com um bloco por id de espécie',
    ]);
  });

  test('reprova id que não existe no catálogo', () => {
    expect(validarExigenciasDeManejo({ bromelia: fichaCompleta }, IDS_DO_CATALOGO)).toEqual([
      'ficha de bromelia: não existe espécie com esse id no catálogo',
    ]);
  });

  test('reprova fato faltando, porque em branco contaria como "não"', () => {
    const semEncharcamento = { ...fichaCompleta, morreComEncharcamento: undefined };
    expect(validarExigenciasDeManejo({ tomate: semEncharcamento }, IDS_DO_CATALOGO)).toEqual([
      'ficha de tomate: morreComEncharcamento é obrigatório, com presente e fonte',
    ]);
  });

  test('reprova resposta que não é true nem false', () => {
    const comRevisar = { ...fichaCompleta, exigeControleDePraga: { presente: 'revisar', fonte: FONTE } };
    expect(validarExigenciasDeManejo({ tomate: comRevisar }, IDS_DO_CATALOGO)).toEqual([
      'ficha de tomate: exigeControleDePraga.presente precisa ser true ou false',
    ]);
  });

  test('reprova fato sem fonte: o mesmo rigor que o catálogo exige das faixas', () => {
    const semFonte = { ...fichaCompleta, exigeManejoEstrutural: { presente: true, fonte: '  ' } };
    expect(validarExigenciasDeManejo({ tomate: semFonte }, IDS_DO_CATALOGO)).toEqual([
      'ficha de tomate: exigeManejoEstrutural precisa citar a publicação consultada em fonte',
    ]);
  });
});

describe('idsSemFichaDeManejo', () => {
  test('lista o que ainda falta pesquisar, na ordem do catálogo', () => {
    expect(idsSemFichaDeManejo({ tomate: fichaCompleta }, ['abobrinha', 'tomate', 'zamioculca'])).toEqual([
      'abobrinha',
      'zamioculca',
    ]);
  });

  test('com o arquivo vazio, falta o catálogo inteiro', () => {
    expect(idsSemFichaDeManejo({}, IDS_DO_CATALOGO)).toEqual(IDS_DO_CATALOGO);
  });
});

describe('fichaDeManejo', () => {
  test('entrega a ficha completa da espécie', () => {
    expect(fichaDeManejo({ tomate: fichaCompleta }, 'tomate')).toEqual(fichaCompleta);
  });

  test('devolve null para espécie sem ficha, em vez de inventar "não" para os três fatos', () => {
    expect(fichaDeManejo({ tomate: fichaCompleta }, 'orquidea')).toBeNull();
  });

  test('devolve null para ficha incompleta', () => {
    expect(fichaDeManejo({ tomate: { ...fichaCompleta, morreComEncharcamento: undefined } }, 'tomate')).toBeNull();
  });
});

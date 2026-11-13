import { Planta } from '@/dominio/modelos/Planta';
import { APARENCIA_INICIAL } from '@/dominio/modelos/Aparencia';
import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { Leitura } from '@/dominio/modelos/Leitura';
import { EstimadorDeColheitaPorCondicoes } from '@/dominio/regras/EstimadorDeColheitaPorCondicoes';

const MILIS_POR_MINUTO = 60_000;
const agora = new Date(2026, 5, 15, 12, 0);
const planta = Planta.criar({
  id: 'p1', idEspecie: 'tomate', apelido: 'Tomatinho', aparencia: APARENCIA_INICIAL,
  cadastradaEm: new Date(2026, 4, 26, 12, 0),
});
const especie: EspecieVegetal = {
  id: 'tomate', nomeComum: 'Tomate', nomeCientifico: 'Solanum lycopersicum', nomesAlternativos: [], foto: null,
  faixasIdeais: {
    umidadeDoAr: { minimo: 40, maximo: 70, fonte: 'teste' },
    temperatura: { minimo: 18, maximo: 28, fonte: 'teste' },
    luminosidade: { minimo: 1, maximo: 100, fonte: 'teste' },
    luzDiaria: { minimo: 1, maximo: 30, fonte: 'teste' },
    umidadeDoArNoturna: { minimo: 45, maximo: 80, fonte: 'teste' },
    temperaturaNoturna: { minimo: 12, maximo: 22, fonte: 'teste' },
  },
  intervaloDeRegaEmDias: 3, nivelDeDificuldade: 'medio', cicloAteColheitaEmDias: { minimo: 70, maximo: 90 },
  frutifera: true, tempoMedioAteColheitaEmDias: 80,
};

function leiturasACadaMeiaHora(
  horas: number,
  criar: (instante: Date, indice: number) => Pick<Leitura, 'umidadePercentual' | 'temperaturaCelsius'>,
): Leitura[] {
  const quantidade = horas * 2;
  return Array.from({ length: quantidade }, (_, indice) => {
    const medidaEm = new Date(agora.getTime() - quantidade * 30 * MILIS_POR_MINUTO + indice * 30 * MILIS_POR_MINUTO);
    return { luminosidadeLux: 5, medidaEm, ...criar(medidaEm, indice) };
  });
}

const temperaturaIdeal = (instante: Date) => (instante.getHours() < 6 || instante.getHours() >= 18 ? 18 : 23);
const ideais = () => leiturasACadaMeiaHora(8, (instante) => ({ umidadePercentual: 55, temperaturaCelsius: temperaturaIdeal(instante) }));

describe('EstimadorDeColheitaPorCondicoes', () => {
  const estimador = new EstimadorDeColheitaPorCondicoes();

  test('com cobertura suficiente e condições ideais, mantém o ciclo médio', () => {
    expect(estimador.estimar(planta, especie, ideais(), agora)).toMatchObject({
      disponivel: true, cicloEstimadoEmDias: 80, diasRestantes: 60, ajustada: true, coberturaEmHoras: 8,
    });
  });

  test('desvios prolongados atrasam a estimativa proporcionalmente ao tempo observado', () => {
    const leituras = leiturasACadaMeiaHora(8, (instante, indice) => ({
      umidadePercentual: 55,
      temperaturaCelsius: indice < 8 ? temperaturaIdeal(instante) : 35,
    }));
    expect(estimador.estimar(planta, especie, leituras, agora)).toMatchObject({
      disponivel: true, cicloEstimadoEmDias: 92, diasRestantes: 72, ajustada: true,
    });
  });

  test('limita o atraso máximo a trinta por cento do ciclo médio', () => {
    const leituras = leiturasACadaMeiaHora(8, () => ({ umidadePercentual: 100, temperaturaCelsius: 40 }));
    expect(estimador.estimar(planta, especie, leituras, agora)).toMatchObject({
      disponivel: true, cicloEstimadoEmDias: 104, diasRestantes: 84,
    });
  });

  test('não ultrapassa o teto exato de trinta por cento em ciclos que produzem fração', () => {
    const cicloDe45Dias = { ...especie, tempoMedioAteColheitaEmDias: 45 };
    const leituras = leiturasACadaMeiaHora(8, () => ({ umidadePercentual: 100, temperaturaCelsius: 40 }));
    expect(estimador.estimar(planta, cicloDe45Dias, leituras, agora)).toMatchObject({
      disponivel: true, cicloEstimadoEmDias: 58.5,
    });
  });

  test('usa a faixa noturna nas leituras feitas durante a noite', () => {
    const inicio = new Date(2026, 5, 15, 0, 0);
    const leituras = Array.from({ length: 16 }, (_, indice) => ({
      umidadePercentual: 55,
      temperaturaCelsius: temperaturaIdeal(new Date(inicio.getTime() + indice * 30 * MILIS_POR_MINUTO)),
      luminosidadeLux: 5,
      medidaEm: new Date(inicio.getTime() + indice * 30 * MILIS_POR_MINUTO),
    }));
    expect(estimador.estimar(planta, especie, leituras, new Date(2026, 5, 15, 8, 0))).toMatchObject({
      disponivel: true, cicloEstimadoEmDias: 80,
    });
  });

  test('sem leituras recentes usa a média e sinaliza que não foi ajustada', () => {
    expect(estimador.estimar(planta, especie, [], agora)).toMatchObject({
      disponivel: true, cicloEstimadoEmDias: 80, diasRestantes: 60, ajustada: false, coberturaEmHoras: 0,
    });
  });

  test('cobertura inferior a seis horas não ajusta a estimativa', () => {
    const poucas = leiturasACadaMeiaHora(5.5, () => ({ umidadePercentual: 100, temperaturaCelsius: 40 }));
    expect(estimador.estimar(planta, especie, poucas, agora)).toMatchObject({
      disponivel: true, cicloEstimadoEmDias: 80, ajustada: false,
    });
  });

  test('lacunas entre leituras não contam como tempo em desvio', () => {
    const leituras: Leitura[] = [
      { umidadePercentual: 100, temperaturaCelsius: 40, luminosidadeLux: 2, medidaEm: new Date(agora.getTime() - 26 * 60 * 60_000) },
      ...ideais(),
    ];
    expect(estimador.estimar(planta, especie, leituras, agora)).toMatchObject({
      disponivel: true, cicloEstimadoEmDias: 80, coberturaEmHoras: 8,
    });
  });

  test('uma leitura ruim não é extrapolada durante a lacuna dentro da janela de 24 horas', () => {
    const leituras: Leitura[] = [
      { umidadePercentual: 100, temperaturaCelsius: 40, luminosidadeLux: 2, medidaEm: new Date(agora.getTime() - 10 * 60 * 60_000) },
      ...leiturasACadaMeiaHora(8, (instante) => ({
        umidadePercentual: 55,
        temperaturaCelsius: temperaturaIdeal(instante),
      })),
    ];
    const resultado = estimador.estimar(planta, especie, leituras, agora);

    expect(resultado).toMatchObject({ disponivel: true, coberturaEmHoras: 8.5 });
    if (resultado.disponivel) expect(resultado.cicloEstimadoEmDias).toBeCloseTo(80 + (0.5 / 8.5) * 24);
  });

  test('ignora leituras inválidas e futuras', () => {
    const leituras: Leitura[] = [
      ...ideais(),
      { umidadePercentual: 100, temperaturaCelsius: 40, luminosidadeLux: 2, medidaEm: new Date(agora.getTime() + 60_000) },
      { umidadePercentual: Number.NaN, temperaturaCelsius: 40, luminosidadeLux: 2, medidaEm: new Date(agora.getTime() - 60_000) },
    ];
    expect(estimador.estimar(planta, especie, leituras, agora)).toMatchObject({
      disponivel: true, cicloEstimadoEmDias: 80, coberturaEmHoras: 8,
    });
  });

  test('nunca retorna dias restantes negativos após a data estimada', () => {
    const antiga = Planta.criar({ ...planta, cadastradaEm: new Date(2025, 0, 1) });
    expect(estimador.estimar(antiga, especie, [], agora)).toMatchObject({
      disponivel: true, cicloEstimadoEmDias: 80, diasRestantes: 0,
    });
  });

  test.each([
    ['sem data de cadastro', Planta.criar({ ...planta, cadastradaEm: null }), especie],
    ['sem ciclo médio', planta, { ...especie, tempoMedioAteColheitaEmDias: undefined }],
    ['ciclo médio inválido', planta, { ...especie, tempoMedioAteColheitaEmDias: Number.NaN }],
  ])('%s retorna estimativa indisponível', (_caso, plantaTeste, especieTeste) => {
    expect(estimador.estimar(plantaTeste, especieTeste, [], agora)).toMatchObject({ disponivel: false });
  });

  test('sem faixas ideais usa o ciclo médio sem ajuste ambiental', () => {
    expect(estimador.estimar(planta, { ...especie, faixasIdeais: null }, ideais(), agora)).toMatchObject({
      disponivel: true, cicloEstimadoEmDias: 80, ajustada: false, coberturaEmHoras: 0,
    });
  });

  test('amostras duplicadas não contam cobertura duas vezes', () => {
    const duplicada = [...ideais(), ...ideais()];
    expect(estimador.estimar(planta, especie, duplicada, agora)).toMatchObject({
      disponivel: true, cicloEstimadoEmDias: 80, coberturaEmHoras: 8,
    });
  });

  test('frequência maior de amostras não aumenta o peso de um mesmo período em desvio', () => {
    const aCadaQuinzeMinutos = Array.from({ length: 32 }, (_, indice) => {
      const medidaEm = new Date(agora.getTime() - 8 * 60 * 60_000 + indice * 15 * MILIS_POR_MINUTO);
      const foraDoIdeal = medidaEm.getTime() >= agora.getTime() - 4 * 60 * 60_000;
      return {
        umidadePercentual: 55,
        temperaturaCelsius: foraDoIdeal ? 35 : temperaturaIdeal(medidaEm),
        luminosidadeLux: 5,
        medidaEm,
      };
    });
    const aCadaTrintaMinutos = leiturasACadaMeiaHora(8, (instante, indice) => ({
      umidadePercentual: 55,
      temperaturaCelsius: indice >= 8 ? 35 : temperaturaIdeal(instante),
    }));

    expect(estimador.estimar(planta, especie, aCadaQuinzeMinutos, agora)).toMatchObject({
      cicloEstimadoEmDias: 92, coberturaEmHoras: 8,
    });
    expect(estimador.estimar(planta, especie, aCadaTrintaMinutos, agora)).toMatchObject({
      cicloEstimadoEmDias: 92, coberturaEmHoras: 8,
    });
  });
});

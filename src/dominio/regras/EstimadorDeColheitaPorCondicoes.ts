import { EstimadorDeColheita, EstimativaDeColheita } from '@/dominio/portas/EstimadorDeColheita';
import { EspecieVegetal, FaixaIdeal } from '@/dominio/modelos/EspecieVegetal';
import { Leitura } from '@/dominio/modelos/Leitura';
import { Planta } from '@/dominio/modelos/Planta';
import { diasNoJardim } from './TempoNoJardim';
import { ehNoite, NASCER_DO_SOL, POR_DO_SOL } from './PeriodoDoDia';

export const JANELA_DA_ESTIMATIVA_MS = 24 * 60 * 60_000;
export const VALIDADE_DA_LEITURA_MS = 30 * 60_000;
export const COBERTURA_MINIMA_PARA_AJUSTE_MS = 6 * 60 * 60_000;
export const ATRASO_MAXIMO_DA_ESTIMATIVA = 0.3;

/** Política conservadora: desvios ambientais podem atrasar, mas nunca antecipar, a primeira colheita. */
export class EstimadorDeColheitaPorCondicoes implements EstimadorDeColheita {
  estimar(
    planta: Planta,
    especie: EspecieVegetal,
    leituras: readonly Leitura[],
    agora: Date,
  ): EstimativaDeColheita {
    const dataDeCadastro = planta.cadastradaEm;
    if (dataDeCadastro === null || Number.isNaN(dataDeCadastro.getTime()) || Number.isNaN(agora.getTime())) {
      return { disponivel: false, motivo: 'sem-data-de-cadastro' };
    }

    const cicloMedio = especie.tempoMedioAteColheitaEmDias;
    if (cicloMedio === undefined || !Number.isFinite(cicloMedio) || cicloMedio <= 0) {
      return { disponivel: false, motivo: 'sem-tempo-medio' };
    }
    const faixas = especie.faixasIdeais;

    const { coberturaMs, desvioMs } = faixas === null
      ? { coberturaMs: 0, desvioMs: 0 }
      : this.coberturaObservada(leituras, agora, especie);
    const ajustada = coberturaMs >= COBERTURA_MINIMA_PARA_AJUSTE_MS;
    const proporcaoForaDoIdeal = ajustada && coberturaMs > 0 ? desvioMs / coberturaMs : 0;
    const fator = 1 + ATRASO_MAXIMO_DA_ESTIMATIVA * proporcaoForaDoIdeal;
    const cicloEstimadoEmDias = cicloMedio * fator;
    const dias = diasNoJardim(dataDeCadastro, agora) ?? 0;

    return {
      disponivel: true,
      cicloEstimadoEmDias,
      diasRestantes: Math.max(0, Math.ceil(cicloEstimadoEmDias - dias)),
      ajustada,
      coberturaEmHoras: Math.round((coberturaMs / 3_600_000) * 100) / 100,
    };
  }

  private coberturaObservada(
    leituras: readonly Leitura[],
    agora: Date,
    especie: EspecieVegetal,
  ): { coberturaMs: number; desvioMs: number } {
    const inicioDaJanela = agora.getTime() - JANELA_DA_ESTIMATIVA_MS;
    const validas = leituras
      .filter((leitura) =>
        Number.isFinite(leitura.medidaEm.getTime()) &&
        Number.isFinite(leitura.temperaturaCelsius) &&
        Number.isFinite(leitura.umidadePercentual) &&
        leitura.medidaEm.getTime() < agora.getTime(),
      )
      .slice()
      .sort((a, b) => a.medidaEm.getTime() - b.medidaEm.getTime());

    let coberturaMs = 0;
    let desvioMs = 0;
    for (let indice = 0; indice < validas.length; indice += 1) {
      const leitura = validas[indice];
      const inicio = Math.max(inicioDaJanela, leitura.medidaEm.getTime());
      const proximaLeitura = validas[indice + 1]?.medidaEm.getTime() ?? agora.getTime();
      const fim = Math.min(agora.getTime(), leitura.medidaEm.getTime() + VALIDADE_DA_LEITURA_MS, proximaLeitura);
      if (fim <= inicio) continue;

      let segmentoInicio = inicio;
      while (segmentoInicio < fim) {
        const segmentoFim = Math.min(fim, proximaMudancaDePeriodo(segmentoInicio));
        const duracao = segmentoFim - segmentoInicio;
        coberturaMs += duracao;
        if (!estaNasFaixas(leitura, especie, new Date(segmentoInicio + duracao / 2))) desvioMs += duracao;
        segmentoInicio = segmentoFim;
      }
    }
    return { coberturaMs, desvioMs };
  }
}

function estaNasFaixas(leitura: Leitura, especie: EspecieVegetal, instante: Date): boolean {
  const faixas = especie.faixasIdeais;
  if (faixas === null) return false;
  const noturna = ehNoite(instante);
  const temperatura = noturna ? faixas.temperaturaNoturna : faixas.temperatura;
  const umidade = noturna ? faixas.umidadeDoArNoturna : faixas.umidadeDoAr;
  return dentroDaFaixa(leitura.temperaturaCelsius, temperatura) && dentroDaFaixa(leitura.umidadePercentual, umidade);
}

function dentroDaFaixa(valor: number, faixa: FaixaIdeal | null | undefined): boolean {
  return faixa !== null && faixa !== undefined && valor >= faixa.minimo && valor <= faixa.maximo;
}

function proximaMudancaDePeriodo(instanteMs: number): number {
  const instante = new Date(instanteMs);
  const amanha = new Date(instante.getFullYear(), instante.getMonth(), instante.getDate() + 1);
  const mudancas = [
    new Date(instante.getFullYear(), instante.getMonth(), instante.getDate(), NASCER_DO_SOL).getTime(),
    new Date(instante.getFullYear(), instante.getMonth(), instante.getDate(), POR_DO_SOL).getTime(),
    new Date(amanha.getFullYear(), amanha.getMonth(), amanha.getDate(), NASCER_DO_SOL).getTime(),
  ];
  return mudancas.find((mudanca) => mudanca > instanteMs) ?? amanha.getTime();
}

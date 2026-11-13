import { EspecieVegetal } from '../modelos/EspecieVegetal';
import { Leitura } from '../modelos/Leitura';
import { Planta } from '../modelos/Planta';

export type EstimativaDeColheita =
  | {
      readonly disponivel: true;
      /** Duração total estimada, arredondada para cima, desde o cadastro até a primeira colheita. */
      readonly cicloEstimadoEmDias: number;
      readonly diasRestantes: number;
      /** True quando há cobertura suficiente de leituras para aplicar o modelo ambiental. */
      readonly ajustada: boolean;
      readonly coberturaEmHoras: number;
    }
  | {
      readonly disponivel: false;
      readonly motivo: 'sem-data-de-cadastro' | 'sem-tempo-medio';
    };

/** Contrato do cálculo de previsão de colheita com base no ciclo da espécie e nas leituras ambientais recentes. */
export interface EstimadorDeColheita {
  estimar(planta: Planta, especie: EspecieVegetal, leituras: readonly Leitura[], agora: Date): EstimativaDeColheita;
}

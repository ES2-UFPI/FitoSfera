import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { LeituraAmbiental } from '@/dominio/modelos/LeituraAmbiental';
import { Planta } from '@/dominio/modelos/Planta';
import { SituacoesDaLeitura } from '@/dominio/regras/AvaliacaoDaLeitura';
import { StatusDaPlanta } from '@/dominio/regras/StatusDaPlanta';

/** Uma planta da pessoa já cruzada com o catálogo e com a última leitura do sensor. */
export interface PlantaNoJardim {
  readonly planta: Planta;
  /** Null se a espécie tiver saído do catálogo. */
  readonly especie: EspecieVegetal | null;
  readonly status: StatusDaPlanta;
  readonly ultimaLeitura: LeituraAmbiental | null;
  readonly leituraDesatualizada: boolean;
  readonly situacoes: SituacoesDaLeitura | null;
}

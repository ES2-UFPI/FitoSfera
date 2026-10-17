import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { Planta } from '@/dominio/modelos/Planta';
import { StatusDaPlanta } from '@/dominio/regras/StatusDaPlanta';

/** Uma planta da pessoa já cruzada com o catálogo e com a última leitura do sensor. */
export interface PlantaNoJardim {
  readonly planta: Planta;
  /** Null se a espécie tiver saído do catálogo. */
  readonly especie: EspecieVegetal | null;
  readonly status: StatusDaPlanta;
}

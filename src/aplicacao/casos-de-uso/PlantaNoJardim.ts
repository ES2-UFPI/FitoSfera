import { EspecieVegetal } from '@/dominio/modelos/EspecieVegetal';
import { Planta } from '@/dominio/modelos/Planta';

/** Uma planta da pessoa já cruzada com o catálogo. A espécie é null se tiver saído do catálogo. */
export interface PlantaNoJardim {
  readonly planta: Planta;
  readonly especie: EspecieVegetal | null;
}

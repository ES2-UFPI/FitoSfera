import { ID_JARDIM_PRINCIPAL } from './Planta';

export interface Jardim {
  readonly id: string;
  readonly nome: string;
  readonly idSensor: string | null;
}

export const JARDIM_PRINCIPAL: Jardim = {
  id: ID_JARDIM_PRINCIPAL,
  nome: 'Jardim principal',
  idSensor: null,
};

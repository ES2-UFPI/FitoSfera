import { ComponentType } from 'react';
import { IdForma } from '@/dominio/modelos/Aparencia';
import { FormaErva } from './FormaErva';
import { FormaEreta } from './FormaEreta';
import { FormaEspiga } from './FormaEspiga';
import { FormaFlor } from './FormaFlor';
import { FormaFrutifera } from './FormaFrutifera';
import { FormaPendente } from './FormaPendente';
import { FormaRasteira } from './FormaRasteira';
import { FormaSuculenta } from './FormaSuculenta';
import { PropsDaForma } from './pecas';

export { RamosPendentes } from './FormaPendente';
export type { PropsDaForma } from './pecas';

export const DESENHOS_DAS_FORMAS: Record<IdForma, ComponentType<PropsDaForma>> = {
  frutifera: FormaFrutifera,
  erva: FormaErva,
  flor: FormaFlor,
  espiga: FormaEspiga,
  rasteira: FormaRasteira,
  pendente: FormaPendente,
  ereta: FormaEreta,
  suculenta: FormaSuculenta,
};

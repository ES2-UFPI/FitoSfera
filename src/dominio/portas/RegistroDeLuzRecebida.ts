import { Leitura } from '../modelos/Leitura';
import { PeriodoDeLuz } from '../regras/LuzRecebida';

/** Contabiliza, por jardim, a luz que o sensor somou entre um contato e outro com o app. */
export interface RegistroDeLuzRecebida {
  /** Leitura sem contador de luz não tem efeito. Receber o mesmo contador de novo não conta a luz duas vezes. */
  registrar(idJardim: string, leitura: Leitura): Promise<void>;
  /** Os períodos com luz ou com reinício do sensor, do mais antigo para o mais recente. */
  listar(idJardim: string): Promise<readonly PeriodoDeLuz[]>;
  /** Quando chegou o último contador contabilizado: até ali, a luz do jardim é conhecida. Null se nunca chegou. */
  obterUltimoContato(idJardim: string): Promise<Date | null>;
}

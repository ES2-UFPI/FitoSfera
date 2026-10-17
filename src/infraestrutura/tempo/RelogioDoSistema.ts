import { Relogio } from '@/dominio/portas/Relogio';

export class RelogioDoSistema implements Relogio {
  agora(): Date {
    return new Date();
  }
}

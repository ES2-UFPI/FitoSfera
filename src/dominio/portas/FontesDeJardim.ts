import { SensorDeAmbiente } from './SensorDeAmbiente';

/** Resolve a fonte do jardim sem que aplicação ou domínio conheçam BLE ou armazenamento. */
export interface FontesDeJardim {
  obter(idJardim: string): Promise<SensorDeAmbiente>;
  /** Relógio virtual do jardim em simulação; null quando a fonte usa o tempo real. */
  obterHorarioDeReferencia?(idJardim: string): Promise<Date | null>;
}

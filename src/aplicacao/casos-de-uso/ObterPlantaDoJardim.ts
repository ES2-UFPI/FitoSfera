import { SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { FontesDeJardim } from '@/dominio/portas/FontesDeJardim';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';
import { Leitura } from '@/dominio/modelos/Leitura';
import { AvaliadorDoJardim } from './AvaliadorDoJardim';
import { PlantaNoJardim } from './PlantaNoJardim';

export class ObterPlantaDoJardim {
  private readonly avaliador: AvaliadorDoJardim;

  constructor(
    private readonly plantas: RepositorioDePlantas,
    especies: RepositorioDeEspecies,
    sensor: SensorDeAmbiente,
    relogio: Relogio,
    fontes?: FontesDeJardim,
  ) {
    this.avaliador = new AvaliadorDoJardim(especies, sensor, relogio, fontes);
  }

  async executar(id: string, idJardim?: string): Promise<PlantaNoJardim | null> {
    const planta = await this.plantas.obterPorId(id);
    if (planta === null || (idJardim && planta.idJardim !== idJardim)) return null;
    return this.avaliador.avaliar(planta, await this.avaliador.lerSensor(planta.idJardim));
  }

  /** Reavalia a planta com uma medição já recebida, sem consultar o sensor novamente. */
  async executarComLeitura(id: string, leitura: Leitura, idJardim?: string): Promise<PlantaNoJardim | null> {
    const planta = await this.plantas.obterPorId(id);
    if (planta === null || (idJardim && planta.idJardim !== idJardim)) return null;
    return this.avaliador.avaliar(planta, leitura);
  }
}

import { SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { FontesDeJardim } from '@/dominio/portas/FontesDeJardim';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';
import { AvaliadorDoJardim } from './AvaliadorDoJardim';
import { PlantaNoJardim } from './PlantaNoJardim';

/** Alimenta a estante: todas as plantas, na ordem de cadastro, cada uma com o seu status. */
export class ListarJardimVirtual {
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

  async executar(idJardim?: string): Promise<readonly PlantaNoJardim[]> {
    const [plantas, leitura] = await Promise.all([this.plantas.listar(), this.avaliador.lerSensor(idJardim)]);
    return Promise.all(plantas.filter((planta) => idJardim === undefined || planta.idJardim === idJardim)
      .map((planta) => this.avaliador.avaliar(planta, leitura)));
  }
}

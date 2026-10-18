import { SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
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
  ) {
    this.avaliador = new AvaliadorDoJardim(especies, sensor, relogio);
  }

  async executar(): Promise<readonly PlantaNoJardim[]> {
    const [plantas, leitura] = await Promise.all([this.plantas.listar(), this.avaliador.lerSensor()]);
    return Promise.all(plantas.map((planta) => this.avaliador.avaliar(planta, leitura)));
  }
}

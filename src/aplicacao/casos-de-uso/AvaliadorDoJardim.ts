import { LeituraAmbiental } from '@/dominio/modelos/LeituraAmbiental';
import { Planta } from '@/dominio/modelos/Planta';
import { FonteDeLeituras } from '@/dominio/portas/FonteDeLeituras';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';
import { avaliarStatus } from '@/dominio/regras/StatusDaPlanta';
import { PlantaNoJardim } from './PlantaNoJardim';

/** Cruza planta, catálogo e sensor, para a lista e o detalhe chegarem sempre ao mesmo status. */
export class AvaliadorDoJardim {
  constructor(
    private readonly especies: RepositorioDeEspecies,
    private readonly leituras: FonteDeLeituras,
    private readonly relogio: Relogio,
  ) {}

  /** Uma leitura só para todas as plantas; sensor fora do ar vira "sem leitura", não erro. */
  async lerSensor(): Promise<LeituraAmbiental | null> {
    try {
      return await this.leituras.ultimaLeitura();
    } catch {
      return null;
    }
  }

  async avaliar(planta: Planta, leitura: LeituraAmbiental | null): Promise<PlantaNoJardim> {
    const especie = await this.especies.obterPorId(planta.idEspecie);
    const status = avaliarStatus({ leitura, faixas: especie?.faixasIdeais ?? null, agora: this.relogio.agora() });
    return { planta, especie, status };
  }
}

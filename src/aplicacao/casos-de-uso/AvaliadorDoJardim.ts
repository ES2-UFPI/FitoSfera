import { Leitura } from '@/dominio/modelos/Leitura';
import { Planta } from '@/dominio/modelos/Planta';
import { SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { FontesDeJardim } from '@/dominio/portas/FontesDeJardim';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeEspecies } from '@/dominio/portas/RepositorioDeEspecies';
import { avaliarCondicoes } from '@/dominio/regras/StatusDaPlanta';
import { PlantaNoJardim } from './PlantaNoJardim';

/** Cruza planta, catálogo e sensor, para a lista e o detalhe chegarem sempre ao mesmo status. */
export class AvaliadorDoJardim {
  constructor(
    private readonly especies: RepositorioDeEspecies,
    private readonly sensor: SensorDeAmbiente,
    private readonly relogio: Relogio,
    private readonly fontes?: FontesDeJardim,
  ) {}

  /** Uma leitura só para todas as plantas; sensor fora do ar vira "sem leitura", não erro. */
  async lerSensor(idJardim?: string): Promise<Leitura | null> {
    try {
      const sensor = idJardim && this.fontes ? await this.fontes.obter(idJardim) : this.sensor;
      return await sensor.lerLeituraAtual();
    } catch {
      return null;
    }
  }

  async avaliar(planta: Planta, leitura: Leitura | null): Promise<PlantaNoJardim> {
    const especie = await this.especies.obterPorId(planta.idEspecie);
    const agora = this.relogio.agora();
    // Vale a faixa guardada na planta, não a do catálogo: revisar o catálogo não muda plantas já cadastradas.
    const avaliacao = avaliarCondicoes({ leitura, faixas: planta.faixasRecomendadas, agora });
    return {
      planta,
      especie,
      status: avaliacao.status,
      ultimaLeitura: leitura,
      leituraDesatualizada: avaliacao.leituraDesatualizada,
      situacoes: avaliacao.situacoes,
    };
  }
}

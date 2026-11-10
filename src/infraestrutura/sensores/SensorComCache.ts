import { Leitura } from '@/dominio/modelos/Leitura';
import { CacheDeLeituras } from '@/dominio/portas/CacheDeLeituras';
import { RegistroDeLuzRecebida } from '@/dominio/portas/RegistroDeLuzRecebida';
import { CancelarObservacao, SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { ConexaoDoSensor, EstadoDaConexao } from '@/dominio/modelos/EstadoDaConexao';

/** Adiciona cache persistente a um sensor sem acoplar o protocolo físico ao armazenamento. */
export class SensorComCache implements SensorDeAmbiente {
  constructor(
    private readonly sensor: SensorDeAmbiente,
    private readonly leituras: CacheDeLeituras,
    private readonly idJardim: string,
    private readonly luz?: Pick<RegistroDeLuzRecebida, 'registrar'>,
  ) {}

  async lerLeituraAtual(): Promise<Leitura | null> {
    try {
      const leitura = await this.sensor.lerLeituraAtual();
      if (leitura !== null) {
        await this.guardar(leitura);
        return leitura;
      }
    } catch {
      // Sensor offline: tenta entregar a última leitura salva.
    }
    return this.leituras.obter(this.idJardim);
  }

  async aguardarLeitura(): Promise<Leitura | null> {
    try {
      const leitura = await this.sensor.aguardarLeitura();
      if (leitura !== null) {
        await this.guardar(leitura);
        return leitura;
      }
    } catch {
      // Sensor offline: o chamador pode usar a última leitura salva.
    }
    return this.leituras.obter(this.idJardim);
  }

  /** Uma atualização pedida pela pessoa não mascara falha com o cache; a tela decide como exibir os dados antigos. */
  async atualizarLeitura(): Promise<Leitura | null> {
    const leitura = await this.sensor.atualizarLeitura();
    if (leitura !== null) await this.guardar(leitura);
    return leitura;
  }

  observarLeituras(aoReceber: (leitura: Leitura) => void): CancelarObservacao {
    return this.sensor.observarLeituras((leitura) => {
      void this.guardar(leitura);
      aoReceber(leitura);
    });
  }

  private async guardar(leitura: Leitura): Promise<void> {
    await Promise.all([
      this.leituras.salvar(this.idJardim, leitura).catch((falha) =>
        console.warn('Não foi possível guardar a leitura do sensor.', falha)),
      this.luz?.registrar(this.idJardim, leitura).catch((falha) =>
        console.warn('Não foi possível contabilizar a luz recebida do sensor.', falha)),
    ]);
  }

  consultarEstadoDaConexao(): Promise<EstadoDaConexao> {
    return this.sensor.consultarEstadoDaConexao();
  }

  observarConexao(aoMudar: (conexao: ConexaoDoSensor) => void): CancelarObservacao {
    return this.sensor.observarConexao(aoMudar);
  }
}

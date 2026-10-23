import { ConexaoDoSensor } from '@/dominio/modelos/EstadoDaConexao';
import { CancelarObservacao, SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { FontesDeJardim } from '@/dominio/portas/FontesDeJardim';

/** Para a interface dizer se o dado vem de um sensor ligado agora ou de uma leitura antiga. */
export class AcompanharConexaoDoSensor {
  constructor(private readonly sensor: SensorDeAmbiente, private readonly fontes?: FontesDeJardim) {}

  observar(aoMudar: (conexao: ConexaoDoSensor) => void, idJardim?: string): CancelarObservacao {
    if (!idJardim || !this.fontes) return this.sensor.observarConexao(aoMudar);
    let ativo = true;
    let cancelar: CancelarObservacao | null = null;
    void this.fontes.obter(idJardim).then((sensor) => {
      if (ativo) cancelar = sensor.observarConexao(aoMudar);
    }, (falha) => console.warn('Não deu para observar a conexão do jardim.', falha));
    return () => { ativo = false; cancelar?.(); };
  }
}

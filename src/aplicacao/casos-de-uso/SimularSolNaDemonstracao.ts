import { LUX_DO_SOL_FORTE } from '@/aplicacao/portas/ControleDoSensorDeDesenvolvimento';
import { RegistroDaLuzDeDemonstracao } from '@/aplicacao/portas/RegistroDaLuzDeDemonstracao';
import { Relogio } from '@/dominio/portas/Relogio';
import { preencherSolDesdeAs7h, SolDaDemonstracao } from '@/dominio/regras/LuzDeDemonstracao';

export type ResultadoDaDemonstracao = 'preenchido' | Extract<SolDaDemonstracao, { preenchido: false }>['motivo'];

/**
 * Modo de demonstração com o sensor de verdade: preenche a luz de hoje com sol forte desde as 7h até onde a luz
 * medida pelo sensor começa. Serve para apresentar o app quando o sensor só foi ligado na hora da apresentação.
 */
export class SimularSolNaDemonstracao {
  constructor(
    private readonly luz: RegistroDaLuzDeDemonstracao,
    private readonly relogio: Relogio,
  ) {}

  async executar(idJardim: string): Promise<ResultadoDaDemonstracao> {
    let resultado: ResultadoDaDemonstracao = 'sem-leitura-hoje';
    await this.luz.alterarPeriodos(idJardim, ({ marca, periodos }) => {
      const sol = preencherSolDesdeAs7h({ marca, periodos, agora: this.relogio.agora(), lux: LUX_DO_SOL_FORTE });
      resultado = sol.preenchido ? 'preenchido' : sol.motivo;
      return sol.preenchido ? sol.periodos : null;
    });
    return resultado;
  }
}

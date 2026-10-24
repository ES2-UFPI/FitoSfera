import { Leitura } from '@/dominio/modelos/Leitura';
import { Planta } from '@/dominio/modelos/Planta';
import { Aviso, Notificador } from '@/dominio/portas/Notificador';
import { Relogio } from '@/dominio/portas/Relogio';
import { RepositorioDeAvisos } from '@/dominio/portas/RepositorioDeAvisos';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';
import { SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { FontesDeJardim } from '@/dominio/portas/FontesDeJardim';
import { assinaturaDosDesvios, detectarDesvios } from '@/dominio/regras/DesvioDaLeitura';
import { leituraEstaDesatualizada } from '@/dominio/regras/StatusDaPlanta';
import { montarMensagemDoAviso } from '@/dominio/servicos/MensagemDoAviso';

/**
 * Compara a leitura do sensor com a faixa de cada planta e notifica os desvios novos. Roda na abertura do
 * app e na verificação periódica em segundo plano, por isso nunca lança: em segundo plano não há tela para
 * mostrar erro, e uma falha derrubaria a verificação inteira.
 */
export class AvaliarLeitura {
  constructor(
    private readonly plantas: RepositorioDePlantas,
    private readonly sensor: SensorDeAmbiente,
    private readonly notificador: Notificador,
    private readonly avisos: RepositorioDeAvisos,
    private readonly relogio: Relogio,
    private readonly fontes?: FontesDeJardim,
  ) {}

  /** Os avisos entregues nesta verificação, na ordem das plantas; vazio quando não havia o que avisar. */
  async executar(idJardim?: string): Promise<readonly Aviso[]> {
    // Antes da leitura: é esta chamada que abre o pedido de permissão na primeira execução, e sem sensor
    // configurado nunca haveria leitura para chegar até aqui.
    if (!(await this.notificador.garantirPermissao())) return [];

    const leitura = this.fontes ? null : await this.lerSensor();
    // Sem leitura, ou com uma velha demais, não dá para dizer que o desvio acabou nem que começou.
    if (!this.fontes && (leitura === null || leituraEstaDesatualizada(leitura, this.relogio.agora()))) return [];

    const plantas = (await this.listarPlantas()).filter((planta) => idJardim === undefined || planta.idJardim === idJardim);
    const avisadas = await this.lerAvisadas();
    const assinaturas = new Map<string, string>();
    const entregues: Aviso[] = [];
    const porJardim = new Map<string, Leitura | null>();

    for (const planta of plantas) {
      if (this.fontes && !porJardim.has(planta.idJardim)) {
        try {
          porJardim.set(planta.idJardim, await (await this.fontes.obter(planta.idJardim)).lerLeituraAtual());
        } catch { porJardim.set(planta.idJardim, null); }
      }
      const leituraDaPlanta = this.fontes ? porJardim.get(planta.idJardim) ?? null : leitura;
      if (leituraDaPlanta === null || leituraEstaDesatualizada(leituraDaPlanta, this.relogio.agora())) {
        const anterior = avisadas.get(planta.id);
        if (anterior !== undefined) assinaturas.set(planta.id, anterior);
        continue;
      }
      // Planta sem faixa (espécie que veio sem ela) não tem com o que comparar: nunca desvia.
      const desvios = planta.faixasRecomendadas === null ? [] : detectarDesvios(leituraDaPlanta, planta.faixasRecomendadas);
      const assinatura = assinaturaDosDesvios(desvios);
      // Dentro da faixa: a planta sai do mapa, e um desvio igual mais tarde volta a avisar.
      if (assinatura === '') continue;

      const anterior = avisadas.get(planta.id);
      if (anterior === assinatura) {
        assinaturas.set(planta.id, assinatura);
        continue;
      }

      const { titulo, corpo } = montarMensagemDoAviso(planta.apelido, desvios);
      const aviso: Aviso = { idPlanta: planta.id, titulo, corpo };
      if (await this.entregar(aviso)) {
        assinaturas.set(planta.id, assinatura);
        entregues.push(aviso);
      } else if (anterior !== undefined) {
        // A entrega falhou: mantém o que a pessoa já tinha visto e tenta de novo na próxima verificação.
        assinaturas.set(planta.id, anterior);
      }
    }

    await this.gravarAvisadas(assinaturas);
    return entregues;
  }

  private async lerSensor(): Promise<Leitura | null> {
    try {
      return await this.sensor.lerLeituraAtual();
    } catch {
      return null;
    }
  }

  private async listarPlantas(): Promise<readonly Planta[]> {
    try {
      return await this.plantas.listar();
    } catch (falha) {
      console.warn('Não deu para ler o jardim na verificação das leituras.', falha);
      return [];
    }
  }

  private async lerAvisadas(): Promise<ReadonlyMap<string, string>> {
    try {
      return await this.avisos.listar();
    } catch (falha) {
      console.warn('Não deu para ler os desvios já avisados; posso repetir um aviso.', falha);
      return new Map();
    }
  }

  private async gravarAvisadas(assinaturas: ReadonlyMap<string, string>): Promise<void> {
    try {
      await this.avisos.gravar(assinaturas);
    } catch (falha) {
      console.warn('Não deu para lembrar os desvios avisados; posso repetir um aviso.', falha);
    }
  }

  private async entregar(aviso: Aviso): Promise<boolean> {
    try {
      await this.notificador.notificar(aviso);
      return true;
    } catch (falha) {
      console.warn('Não deu para enviar a notificação do desvio.', falha);
      return false;
    }
  }
}

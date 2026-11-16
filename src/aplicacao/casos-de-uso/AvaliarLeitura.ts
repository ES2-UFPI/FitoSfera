import { JANELA_PADRAO, JanelaDeLembretes } from '@/dominio/modelos/JanelaDeLembretes';
import { Leitura } from '@/dominio/modelos/Leitura';
import { Planta } from '@/dominio/modelos/Planta';
import { Aviso, Notificador } from '@/dominio/portas/Notificador';
import { Relogio } from '@/dominio/portas/Relogio';
import { RegistroDeDesviosEmAberto } from '@/dominio/portas/RegistroDeDesviosEmAberto';
import { RepositorioDeAvisos } from '@/dominio/portas/RepositorioDeAvisos';
import { RepositorioDePlantas } from '@/dominio/portas/RepositorioDePlantas';
import { RepositorioDePreferencias } from '@/dominio/portas/RepositorioDePreferencias';
import { SensorDeAmbiente } from '@/dominio/portas/SensorDeAmbiente';
import { FontesDeJardim } from '@/dominio/portas/FontesDeJardim';
import {
  acompanharDesvios,
  assinaturaDosDesvios,
  detectarDesvios,
  TEMPO_MINIMO_DO_DESVIO_MS,
} from '@/dominio/regras/DesvioDaLeitura';
import { estaNaJanela } from '@/dominio/regras/HorarioDoLembrete';
import { faltouLuzNoDia, HORA_DO_AVISO_DE_LUZ, LuzDoDia } from '@/dominio/regras/LuzDoDia';
import { leituraEstaDesatualizada } from '@/dominio/regras/StatusDaPlanta';
import { montarAvisoDeFaltaDeLuz, montarMensagemDoAviso } from '@/dominio/servicos/MensagemDoAviso';

export interface OpcoesDaAvaliacao {
  /**
   * Onde fica desde quando cada desvio vem aparecendo. Sem ele não há como medir a duração, e o desvio avisa na
   * primeira leitura, como antes do tempo mínimo existir.
   */
  readonly desviosEmAberto?: RegistroDeDesviosEmAberto;
  readonly tempoMinimoDoDesvioMs?: number;
  /** A luz do dia de cada planta, para o aviso de falta de luz. Sem ela, esse aviso não existe. */
  readonly luzDoDia?: { executar(planta: Planta): Promise<LuzDoDia> };
}

/** A memória de avisos guarda o da falta de luz numa chave à parte, com o dia em que ele foi dado. */
const chaveDoAvisoDeLuz = (idPlanta: string) => `${idPlanta}:luz`;

/**
 * Compara a leitura do sensor com a faixa de cada planta e notifica os desvios novos, e avisa, perto do fim do dia,
 * a planta que vai fechar o dia com pouca luz. Roda na abertura do app e na verificação periódica em segundo plano,
 * por isso nunca lança: em segundo plano não há tela para mostrar erro, e uma falha derrubaria a verificação inteira.
 *
 * A leitura é comparada com a faixa do período em que foi medida (dia ou noite), e um desvio só vira aviso depois
 * de durar o tempo mínimo: assim, o frio normal da noite e uma oscilação passageira não incomodam ninguém.
 */
export class AvaliarLeitura {
  constructor(
    private readonly plantas: RepositorioDePlantas,
    private readonly sensor: SensorDeAmbiente,
    private readonly notificador: Notificador,
    private readonly avisos: RepositorioDeAvisos,
    private readonly relogio: Relogio,
    private readonly fontes?: FontesDeJardim,
    /** Sem repositório, vale a janela padrão: o app nunca fica sem horário permitido. */
    private readonly preferencias?: RepositorioDePreferencias,
    private readonly opcoes: OpcoesDaAvaliacao = {},
  ) {}

  /** Os avisos entregues nesta verificação, na ordem das plantas; vazio quando não havia o que avisar. */
  async executar(idJardim?: string): Promise<readonly Aviso[]> {
    // Antes da leitura: é esta chamada que abre o pedido de permissão na primeira execução, e sem sensor
    // configurado nunca haveria leitura para chegar até aqui.
    if (!(await this.notificador.garantirPermissao())) return [];

    const leitura = this.fontes ? null : await this.lerSensor();
    // Sem leitura, ou com uma velha demais, não dá para dizer que o desvio acabou nem que começou.
    if (!this.fontes && (leitura === null || leituraEstaDesatualizada(leitura, this.relogio.agora()))) return [];

    const agora = this.relogio.agora();
    // Fora da janela nada é entregue, e o desvio não é marcado como avisado: a próxima verificação dentro
    // dela entrega. Se até lá o desvio tiver passado, a assinatura fica vazia e ninguém é incomodado.
    const podeNotificarAgora = estaNaJanela(await this.lerJanela(), agora);
    const plantas = (await this.listarPlantas()).filter((planta) => idJardim === undefined || planta.idJardim === idJardim);
    const avisadas = await this.lerAvisadas();
    const emAberto = await this.lerDesviosEmAberto();
    const assinaturas = new Map<string, string>();
    const continuamEmAberto = new Map<string, ReadonlyMap<string, Date>>();
    const entregues: Aviso[] = [];
    const porJardim = new Map<string, Leitura | null>();

    for (const planta of plantas) {
      const avisoDeLuz = await this.avaliarLuzDoDia(planta, avisadas, agora, podeNotificarAgora);
      if (avisoDeLuz.lembrar !== null) assinaturas.set(chaveDoAvisoDeLuz(planta.id), avisoDeLuz.lembrar);
      if (avisoDeLuz.entregue !== null) entregues.push(avisoDeLuz.entregue);

      if (this.fontes && !porJardim.has(planta.idJardim)) {
        try {
          porJardim.set(planta.idJardim, await (await this.fontes.obter(planta.idJardim)).aguardarLeitura());
        } catch { porJardim.set(planta.idJardim, null); }
      }
      const leituraDaPlanta = this.fontes ? porJardim.get(planta.idJardim) ?? null : leitura;
      if (leituraDaPlanta === null || leituraEstaDesatualizada(leituraDaPlanta, agora)) {
        const anterior = avisadas.get(planta.id);
        if (anterior !== undefined) assinaturas.set(planta.id, anterior);
        // Sem leitura não dá para dizer se o desvio continuou: a contagem fica como estava.
        const vistos = emAberto.get(planta.id);
        if (vistos !== undefined) continuamEmAberto.set(planta.id, vistos);
        continue;
      }
      // Planta sem faixa (espécie que veio sem ela) não tem com o que comparar: nunca desvia.
      const detectados = planta.faixasRecomendadas === null ? [] : detectarDesvios(leituraDaPlanta, planta.faixasRecomendadas);
      const { vistosDesde, confirmados: desvios } = this.desviosEmAberto
        ? acompanharDesvios(detectados, emAberto.get(planta.id) ?? new Map(), leituraDaPlanta.medidaEm, this.tempoMinimo)
        : { vistosDesde: new Map<string, Date>(), confirmados: detectados };
      if (vistosDesde.size > 0) continuamEmAberto.set(planta.id, vistosDesde);
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
      if (podeNotificarAgora && (await this.entregar(aviso))) {
        assinaturas.set(planta.id, assinatura);
        entregues.push(aviso);
      } else if (anterior !== undefined) {
        // Adiado pela janela, ou entrega falhou: mantém o que a pessoa já tinha visto e tenta na próxima.
        assinaturas.set(planta.id, anterior);
      }
    }

    await this.gravarAvisadas(assinaturas);
    await this.gravarDesviosEmAberto(continuamEmAberto);
    return entregues;
  }

  private get desviosEmAberto(): RegistroDeDesviosEmAberto | undefined {
    return this.opcoes.desviosEmAberto;
  }

  private get tempoMinimo(): number {
    return this.opcoes.tempoMinimoDoDesvioMs ?? TEMPO_MINIMO_DO_DESVIO_MS;
  }

  /**
   * O aviso de falta de luz da planta, no máximo um por dia. Devolve o que lembrar na memória de avisos (o dia em
   * que ele foi dado, ou null para esquecer) e o aviso entregue nesta verificação, se houve. Fora da janela, ou se a
   * entrega falhar, nada é lembrado, e a próxima verificação do mesmo dia tenta de novo.
   */
  private async avaliarLuzDoDia(
    planta: Planta,
    avisadas: ReadonlyMap<string, string>,
    agora: Date,
    podeNotificarAgora: boolean,
  ): Promise<{ lembrar: string | null; entregue: Aviso | null }> {
    const hoje = diaLocal(agora);
    if (avisadas.get(chaveDoAvisoDeLuz(planta.id)) === hoje) return { lembrar: hoje, entregue: null };
    if (this.opcoes.luzDoDia === undefined || agora.getHours() < HORA_DO_AVISO_DE_LUZ) return { lembrar: null, entregue: null };

    let luz: LuzDoDia;
    try {
      luz = await this.opcoes.luzDoDia.executar(planta);
    } catch (falha) {
      console.warn('Não deu para calcular a luz do dia na verificação das leituras.', falha);
      return { lembrar: null, entregue: null };
    }
    if (!faltouLuzNoDia(luz, agora) || luz.progresso === null || !podeNotificarAgora) return { lembrar: null, entregue: null };

    const aviso: Aviso = { idPlanta: planta.id, ...montarAvisoDeFaltaDeLuz(planta.apelido, luz.progresso) };
    return (await this.entregar(aviso)) ? { lembrar: hoje, entregue: aviso } : { lembrar: null, entregue: null };
  }

  private async lerDesviosEmAberto(): Promise<ReadonlyMap<string, ReadonlyMap<string, Date>>> {
    if (this.desviosEmAberto === undefined) return new Map();
    try {
      return await this.desviosEmAberto.listar();
    } catch (falha) {
      console.warn('Não deu para ler os desvios em aberto; a contagem do tempo mínimo recomeça.', falha);
      return new Map();
    }
  }

  private async gravarDesviosEmAberto(desvios: ReadonlyMap<string, ReadonlyMap<string, Date>>): Promise<void> {
    if (this.desviosEmAberto === undefined) return;
    try {
      await this.desviosEmAberto.gravar(desvios);
    } catch (falha) {
      console.warn('Não deu para lembrar os desvios em aberto; a contagem do tempo mínimo recomeça.', falha);
    }
  }

  /** Preferência que não dá para ler vale como a padrão: melhor a janela conhecida do que notificar sempre. */
  private async lerJanela(): Promise<JanelaDeLembretes> {
    if (this.preferencias === undefined) return JANELA_PADRAO;
    try {
      return await this.preferencias.obterJanelaDeLembretes();
    } catch (falha) {
      console.warn('Não deu para ler a janela de lembretes; vale a padrão.', falha);
      return JANELA_PADRAO;
    }
  }

  private async lerSensor(): Promise<Leitura | null> {
    try {
      // Aguarda: na abertura do app e na tarefa de fundo o sensor Bluetooth ainda está conectando.
      return await this.sensor.aguardarLeitura();
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

/** O dia local do instante, como AAAA-MM-DD: o aviso de falta de luz vale por dia. */
function diaLocal(instante: Date): string {
  const doisDigitos = (valor: number) => String(valor).padStart(2, '0');
  return `${instante.getFullYear()}-${doisDigitos(instante.getMonth() + 1)}-${doisDigitos(instante.getDate())}`;
}

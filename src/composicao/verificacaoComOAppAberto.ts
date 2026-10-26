/** Só o que o acompanhamento usa do container. */
interface ComAvaliacaoDeLeitura {
  readonly avaliarLeitura: { executar(): Promise<unknown> };
}

/** O firmware publica uma leitura por minuto; verificar mais vezes só repetiria a mesma leitura. */
export const INTERVALO_DA_VERIFICACAO_COM_O_APP_ABERTO_MS = 60_000;

/**
 * Com o app aberto, avalia as leituras a cada minuto. Sem isto, os avisos dependeriam só da tarefa do sistema,
 * que roda no mínimo a cada 15 minutos, e da verificação feita uma vez na abertura. Nunca sobrepõe duas
 * verificações: uma pode levar até o tempo limite da leitura, e outra por cima só pediria a mesma leitura.
 * Devolve a função que encerra o acompanhamento.
 */
export function acompanharLeiturasComOAppAberto(
  container: ComAvaliacaoDeLeitura,
  intervaloMs = INTERVALO_DA_VERIFICACAO_COM_O_APP_ABERTO_MS,
): () => void {
  let emAndamento = false;
  const temporizador = setInterval(() => {
    if (emAndamento) return;
    emAndamento = true;
    container.avaliarLeitura
      .executar()
      .catch((falha: unknown) => console.warn('A verificação das leituras com o app aberto falhou.', falha))
      .finally(() => {
        emAndamento = false;
      });
  }, intervaloMs);
  return () => clearInterval(temporizador);
}

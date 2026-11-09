/** Só o que o acompanhamento usa do container. */
interface ComAvaliacaoDeLeitura {
  readonly atualizarLeituras: { executar(): Promise<unknown> };
  readonly avaliarLeitura: { executar(): Promise<unknown> };
}

/** O firmware publica automaticamente a cada cinco minutos. */
export const INTERVALO_DA_VERIFICACAO_COM_O_APP_ABERTO_MS = 5 * 60_000;

/**
 * Com o app aberto, atualiza e avalia as leituras a cada cinco minutos. Sem isto, os avisos dependeriam só da tarefa do sistema,
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
    container.atualizarLeituras
      .executar()
      .then(() => container.avaliarLeitura.executar())
      .catch((falha: unknown) => console.warn('A verificação das leituras com o app aberto falhou.', falha))
      .finally(() => {
        emAndamento = false;
      });
  }, intervaloMs);
  return () => clearInterval(temporizador);
}

import { Platform } from 'react-native';
import {
  definirTarefaDeVerificacao,
  INTERVALO_EM_MINUTOS,
  registrarVerificacaoPeriodica,
} from '@/infraestrutura/notificacoes/VerificacaoPeriodica';
import { criarContainer } from './criarContainer';

interface ContainerDeVerificacao {
  readonly atualizarLeituras: { executar(): Promise<void> };
  readonly avaliarLeitura: { executar(): Promise<unknown> };
}

/**
 * Define a tarefa de segundo plano já na carga do módulo, e não dentro de um efeito de tela: quando o
 * Android acorda o app sem abrir nenhuma tela, é só isto que roda. Ali não existe o container do
 * `ProvedorDoAplicativo`, então a tarefa monta o seu próprio. Este módulo é importado pelo `index.ts`, antes
 * do roteador, porque sem tela as rotas (e o `app/_layout.tsx`) não carregam.
 */
definirTarefaDeVerificacao(Platform.OS, async () => {
  const container = criarContainer();
  await container.atualizarLeituras.executar();
  await container.avaliarLeitura.executar();
});

/**
 * Liga a verificação na abertura do app: avalia as leituras uma vez — é esta primeira execução que pede a
 * permissão de notificação — e deixa o sistema repetindo a verificação em segundo plano.
 */
export async function ligarVerificacaoEmSegundoPlano(
  container: ContainerDeVerificacao,
  intervaloEmMinutos = INTERVALO_EM_MINUTOS,
): Promise<void> {
  // Agenda antes da execução imediata: uma falha de rede na abertura não pode impedir as próximas tentativas.
  await registrarVerificacaoPeriodica(intervaloEmMinutos);
  await container.atualizarLeituras.executar();
  await container.avaliarLeitura.executar();
}

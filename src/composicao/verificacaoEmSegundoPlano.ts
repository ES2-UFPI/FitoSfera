import { Platform } from 'react-native';
import {
  definirTarefaDeVerificacao,
  registrarVerificacaoPeriodica,
} from '@/infraestrutura/notificacoes/VerificacaoPeriodica';
import { Container } from './Container';
import { criarContainer } from './criarContainer';

/**
 * Define a tarefa de segundo plano já na carga do módulo, e não dentro de um efeito de tela: quando o
 * Android acorda o app sem abrir nenhuma tela, é só isto que roda. Ali não existe o container do
 * `ProvedorDoAplicativo`, então a tarefa monta o seu próprio. Este módulo é importado pelo `index.ts`, antes
 * do roteador, porque sem tela as rotas (e o `app/_layout.tsx`) não carregam.
 */
definirTarefaDeVerificacao(Platform.OS, async () => {
  await criarContainer().avaliarLeitura.executar();
});

/**
 * Liga a verificação na abertura do app: avalia as leituras uma vez — é esta primeira execução que pede a
 * permissão de notificação — e deixa o sistema repetindo a verificação em segundo plano.
 */
export async function ligarVerificacaoEmSegundoPlano(
  container: Pick<Container, 'avaliarLeitura'>,
): Promise<void> {
  await container.avaliarLeitura.executar();
  await registrarVerificacaoPeriodica();
}

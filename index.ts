// Ponto de entrada do app. A tarefa de segundo plano é definida aqui, antes do roteador: quando o Android acorda
// o app sem tela para a verificação periódica, só este arquivo roda, e as rotas (com o app/_layout.tsx) não carregam.
import './src/composicao/verificacaoEmSegundoPlano';
import 'expo-router/entry';

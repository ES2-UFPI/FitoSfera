# infraestrutura/notificacoes

- `AgendadorDeLembretesExpo` / `AgendadorDeLembretesInativo` — carregados sob demanda:
  `expo-notifications` importado estaticamente derruba o Expo Go.
- `VerificadorPeriodico` — registra a tarefa de reavaliação do jardim
  (`expo-background-task`/WorkManager). O Android impõe um mínimo de ~15 min e decide o
  instante exato; o intervalo é uma intenção, não uma garantia.

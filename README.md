## FitoSfera
Monitoramento inteligente de plantas por área — temperatura, umidade do ar e luminosidade, em qualquer ambiente.

## Rodando o projeto

```bash
npm ci
npm start          # Expo, para abrir no Android
npm run web        # prévia no navegador
npm test           # testes de unidade e de tela
npm run typecheck  # verificação de tipos do app e dos testes
```

## Como o time trabalha

- [CONTRIBUTING.md](CONTRIBUTING.md): branches, commits, pull requests e regras de proteção.
- [Definition of Done](docs/definition-of-done.md): o que precisa estar cumprido para uma task ou história
  estar pronta.
- Todo pull request para `dev` ou `main` passa pelo [CI](.github/workflows/ci.yml), que verifica os tipos,
  valida o catálogo de espécies e roda os testes.

## Onde ficam os dados

- [Catálogo de espécies](src/infraestrutura/catalogo/README.md): schema e como acrescentar uma espécie.
- [Armazenamento local](src/infraestrutura/persistencia/README.md): mapa de chaves, versão do schema e
  migrações.
- [Sensores do ambiente](src/infraestrutura/sensores/README.md): a porta do sensor e como escolher entre
  nenhum sensor (padrão) e o simulado, com `EXPO_PUBLIC_SENSOR=simulado`.
- [Notificações de desvio](src/infraestrutura/notificacoes/README.md): a porta do notificador, a verificação
  em segundo plano e por que o mesmo desvio não avisa duas vezes.

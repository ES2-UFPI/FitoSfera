# FitoSfera 🌿

Monitoramento inteligente de plantas por área — temperatura, umidade do ar e luminosidade, em qualquer ambiente.

## Sobre o projeto

Cuidar de plantas costuma ser um palpite: "será que aqui bate sol demais?", "o ar está seco para esta
espécie?", entre outros. O FitoSfera troca o palpite por dados, lendo as condições do ambiente onde cada planta
está, comparando com a faixa ideal da espécie e avisa quando algo sai do esperado.

Principais recursos:

- **Estante de plantas**: cadastro por espécie, organizado por área (sala, varanda, horta...).
- **Catálogo de espécies**: faixas ideais de temperatura, umidade do ar e luminosidade, intervalo de rega,
  nível de dificuldade e ciclo até a colheita. Funciona sem internet, embutido no app.
- **Painel do ambiente**: leituras atuais dos sensores, com destaque para os valores fora da faixa ideal.
- **Notificações de desvio**: aviso quando uma leitura sai da faixa, inclusive com o app fechado, sem repetir
  o mesmo alerta.

## A quem se destina

- **Quem cultiva em casa**, com plantas em vasos, varanda ou pequena horta, e quer entender o que cada espécie
  precisa.
- **Quem está começando** e ainda não sabe interpretar os sinais da planta. O catálogo indica a dificuldade de
  cada espécie.

O app é distribuído **apenas para Android**. A versão web existe somente como prévia de desenvolvimento.

## Contexto acadêmico

Projeto da disciplina de Engenharia de Software II (ES2) da UFPI, desenvolvido em equipe seguindo uma
metodologia ágil: histórias de usuário, sprints e Definition of Done.

## Tecnologias

React Native e Expo (Expo Router), TypeScript, Jest e Testing Library. O código segue camadas
(`dominio`, `aplicacao`, `infraestrutura`, `apresentacao`), e o sensor, o armazenamento e as notificações
ficam atrás de portas, o que permite trocar o sensor simulado pelo real sem mexer nas regras.

## Rodando o projeto

```bash
npm ci
npm start          # Expo, para abrir no Android
npm run web        # prévia no navegador
npm test           # testes de unidade e de tela
npm run typecheck  # verificação de tipos do app e dos testes
```

Requisitos: Node 22+. Para rodar no Android (`npm run android`), também são necessários JDK 17, Android SDK
e um emulador ou celular com depuração USB.

O Bluetooth do sensor físico usa código nativo e **não funciona no Expo Go**: no Expo Go, o app abre normalmente,
mas sem sensor. Para parear o sensor, instale o development build com `npm run android`.

## Mapa de navegação

A navegação usa o `expo-router`: uma pilha na raiz, com as abas como tela inicial. O app abre na aba **Jardim**,
que é de onde se contam os toques.

```
app/
├── (abas)/                 abas da tela inicial
│   ├── index               Jardim: estante, jardim atual e sensor do ambiente   ← o app abre aqui
│   ├── ajustes             Ajustes: lembretes, sensor pareado e sensor simulado
│   └── ambiente            escondida da barra enquanto for só "Em breve"
├── cadastro/               modal: buscar espécie → aparência → apelido
├── planta/[id]             detalhe: condições, rega, histórico, editar e excluir
├── historico/[id]          todas as regas da planta
├── editar/[id]/            modal: aparência → apelido, reaproveitando o cadastro
├── sensor                  pareamento do sensor BLE
└── lembretes               horário dos lembretes
```

| Função | Caminho a partir do Jardim | Toques |
| --- | --- | --- |
| Ver o jardim | tela inicial | 0 |
| Cadastrar planta | **Nova planta** (ou **Começar**, ou o vaso tracejado) → passos do cadastro | 1 |
| Ver o detalhe da planta | tocar no vaso | 1 |
| Registrar rega | vaso → **Registrar rega** | 2 |
| Ver todas as regas | vaso → **Ver todas as regas** | 2 |
| Editar a planta | vaso → **Editar** → passos da edição | 2 |
| Excluir a planta | vaso → **Excluir** → confirmar | 2 + confirmação |
| Trocar de jardim | cartão do jardim → escolher o jardim | 2 |
| Associar ou parear sensor | cartão do sensor → **Associar …** ou **Parear novo sensor** | 2 |
| Horário dos lembretes | aba **Ajustes** → **Mudar o horário dos lembretes** | 2 |

Tocar numa notificação de desvio abre direto o detalhe da planta citada. Os caminhos da tabela são verificados em
[`testes/telas/mapaDeNavegacao.test.tsx`](testes/telas/mapaDeNavegacao.test.tsx), que falha se alguma função
principal passar de dois toques. Ao criar uma tela nova, acrescente-a à árvore, à tabela e ao teste.

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
- [Sensores do ambiente](src/infraestrutura/sensores/README.md): a porta do sensor, como controlar o simulado
  (padrão em desenvolvimento) e o sensor físico por Bluetooth, com a escolha da biblioteca `react-native-ble-plx`.
- [Firmware do sensor](firmware/README.md): o ESP32 com DHT11 e BH1750, o contrato BLE que o app consome e a
  [montagem na protoboard](firmware/instrucoes_montagem.md).
- [Notificações de desvio](src/infraestrutura/notificacoes/README.md): a porta do notificador, a verificação
  em segundo plano e por que o mesmo desvio não avisa duas vezes.

# Notificações de desvio

O app avisa a pessoa quando a leitura do sensor sai da faixa ideal de uma planta, sem que ela precise abrir o
app. O domínio pede o aviso pela porta [`Notificador`](../../dominio/portas/Notificador.ts), que tem duas
operações:

| Operação | O que faz |
| --- | --- |
| `garantirPermissao()` | Garante a permissão de notificar, pedindo na primeira vez. Devolve `false` quando a pessoa recusou, quando não dá para perguntar de novo ou quando o aparelho não tem notificação. |
| `notificar(aviso)` | Entrega um `Aviso` (id da planta, título e corpo já montados). |

## Implementações

| Plataforma | Implementação | Comportamento |
| --- | --- | --- |
| `android` | [`NotificadorExpo`](NotificadorExpo.ts) | Notificação local do Android, pelo `expo-notifications`, no canal `desvios`. |
| qualquer outra (prévia web, testes) | [`NotificadorInativo`](NotificadorInativo.ts) | Nunca pede permissão e nunca notifica. Como a permissão nunca é concedida, o caso de uso para antes de avaliar as leituras. |

Quem escolhe é [`escolherNotificador.ts`](../../composicao/escolherNotificador.ts), a partir de `Platform.OS`.

Os módulos do Expo entram por importação sob demanda (`import('expo-notifications')`), e não por importação
estática: fora de um build nativo eles não existem, e uma importação estática derrubaria a prévia web e os
testes. Toda falha de carregamento vira "não notifiquei", nunca um erro que sobe para o caso de uso.

## Quem dispara a verificação

O caso de uso [`AvaliarLeitura`](../../aplicacao/casos-de-uso/AvaliarLeitura.ts) compara a leitura com a faixa
de cada planta e notifica os desvios novos. Ele roda em dois momentos, e nunca lança: em segundo plano não há
tela para mostrar erro, e uma falha derrubaria a verificação inteira.

| Momento | Quem chama |
| --- | --- |
| Abertura do app — é esta execução que pede a permissão | `ligarVerificacaoEmSegundoPlano`, em [`verificacaoEmSegundoPlano.ts`](../../composicao/verificacaoEmSegundoPlano.ts), a partir de `app/_layout.tsx` |
| A cada ~15 minutos, com o app fechado | A tarefa de [`VerificacaoPeriodica`](VerificacaoPeriodica.ts), registrada no `expo-background-task` |

A tarefa é definida na carga do módulo, e não dentro de um efeito de tela: quando o Android acorda o app sem
abrir nenhuma tela, é só isso que roda, e é aí que o sistema procura a tarefa. Ali não existe o container do
`ProvedorDoAplicativo`, então a tarefa monta o seu próprio.

O intervalo de 15 minutos é uma intenção, não uma garantia: o Android impõe um mínimo de cerca de 15 minutos e
decide o instante exato pela bateria e pela rede. Aparelho com economia de bateria agressiva pode não registrar
a tarefa; nesse caso a verificação só acontece quando a pessoa abre o app.

## Aviso que não se repete

A regra de desvio é [`DesvioDaLeitura`](../../dominio/regras/DesvioDaLeitura.ts), no domínio. Ela usa a mesma
comparação do painel de condições (`compararMedicaoComFaixa`), então um valor exatamente no limite da faixa
está dentro e não vira desvio.

Cada leitura fora da faixa tem uma **assinatura**: quais grandezas desviaram e para que lado, por exemplo
`temperatura:acima|umidadeDoAr:abaixo`. O [`RepositorioDeAvisos`](../../dominio/portas/RepositorioDeAvisos.ts)
lembra a assinatura já avisada de cada planta, e o caso de uso só notifica quando a assinatura muda:

- a temperatura subir mais ainda é o mesmo desvio e **não** avisa de novo;
- uma grandeza a mais sair da faixa é um desvio novo e avisa;
- a leitura voltar para dentro da faixa esquece a planta, e o mesmo desvio mais tarde volta a avisar;
- um aviso que não chegou a ser entregue é tentado de novo na verificação seguinte.

O texto que a pessoa lê é montado por [`MensagemDoAviso`](../../dominio/servicos/MensagemDoAviso.ts), com o
valor medido e uma indicação curta de que ele está acima ou abaixo do ideal. Os limites detalhados ficam no
painel da planta.

## Como testar no aparelho

A notificação depende de módulo nativo: ela não aparece na prévia web nem no Expo Go, só num build de
desenvolvimento (`npx expo run:android`). Com o sensor simulado, as leituras variam ao longo do dia e saem da
faixa de parte das espécies:

```bash
EXPO_PUBLIC_SENSOR=simulado npx expo run:android
```

A verificação em segundo plano não cumpre o intervalo pedido num emulador parado; para forçar uma execução, use
o `expo-background-task` pelo painel de desenvolvimento do Expo.

## Como acrescentar um canal de aviso

1. Crie nesta pasta uma classe que implemente `Notificador`.
2. Acrescente a escolha em [`escolherNotificador.ts`](../../composicao/escolherNotificador.ts).
3. Cubra a classe e a escolha em `testes/unidade/notificacoes.test.ts`.

Nada em `aplicacao/` ou `apresentacao/` muda. O teste `testes/unidade/arquitetura.test.ts` garante que o
domínio não importa Expo nem React Native, e que aplicação e apresentação não importam a infraestrutura.

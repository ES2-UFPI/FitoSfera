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

A definição também precisa ser síncrona. Por isso, só ali os módulos entram por `require` dentro de um `try`, e
não por `import()`: com um `await` antes do `defineTask`, o Android procura a tarefa antes de ela existir, avisa
"No task registered for key expo-task-manager" e descarta a execução.

O intervalo de 15 minutos é uma intenção, não uma garantia: o Android impõe um mínimo de cerca de 15 minutos e
decide o instante exato pela bateria e pela rede. Aparelho com economia de bateria agressiva pode não registrar
a tarefa; nesse caso a verificação só acontece quando a pessoa abre o app.

## Janela de horários

A pessoa escolhe a faixa de horas em que aceita ser avisada, e o app não notifica fora dela (#28). A janela é
modelada em [`JanelaDeLembretes`](../../dominio/modelos/JanelaDeLembretes.ts) e a regra em
[`HorarioDoLembrete`](../../dominio/regras/HorarioDoLembrete.ts); a preferência é gravada em
`fitosfera:v2:preferencias`. Enquanto a pessoa não escolher, vale das **8h às 21h**.

`fim` antes de `inicio` é uma janela que atravessa a meia-noite (22h às 7h), e `inicio` igual a `fim` libera o
dia inteiro. Os dois limites contam como dentro, como nas faixas recomendadas.

**O aviso fora da janela é adiado, não agendado.** O desvio detectado de madrugada não vira notificação com
hora marcada: ele simplesmente não é entregue, e a assinatura **não** é gravada como avisada. A próxima
verificação periódica que cair dentro da janela detecta o mesmo desvio e aí sim notifica. A consequência é a
desejada: se o desvio tiver passado quando a janela abrir, a assinatura fica vazia e ninguém é incomodado por
um problema que já se resolveu. Agendar a notificação na detecção avisaria de algo que não existe mais.

Como o adiamento depende da verificação periódica, ele herda o intervalo dela: a entrega acontece na primeira
verificação depois de a janela abrir, não no minuto exato da abertura.

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

## Toque na notificação

Tocar no aviso abre o detalhe da planta citada. O caminho começa no payload: o `NotificadorExpo` grava
`data: { idPlanta }` em cada notificação, e é esse id que a navegação usa depois.

Quem avisa a interface é a porta [`ToquesNaNotificacao`](../../aplicacao/portas/ToquesNaNotificacao.ts),
com duas operações, uma para cada situação:

| Operação | Quando serve |
| --- | --- |
| `toqueQueAbriuOApp()` | O app estava **fechado** e o toque foi o que o iniciou. Não havia ouvinte registrado naquele instante, então o Expo guarda a resposta e ela é consultada na abertura. |
| `aoTocar(ouvinte)` | O app já estava **aberto** ou em segundo plano. Devolve como cancelar a escuta. |

| Plataforma | Implementação |
| --- | --- |
| `android` | [`ToquesNaNotificacaoExpo`](ToquesNaNotificacaoExpo.ts), pelo `expo-notifications` |
| qualquer outra (prévia web, testes) | [`ToquesInativos`](ToquesInativos.ts): nenhum toque abre o app e não há o que ouvir |

A escolha é de [`escolherToquesNaNotificacao.ts`](../../composicao/escolherToquesNaNotificacao.ts), e quem
usa a porta é o gancho
[`useAberturaPelaNotificacao`](../../apresentacao/notificacoes/useAberturaPelaNotificacao.ts), montado uma
vez no `app/_layout.tsx`.

Dois cuidados que o gancho resolve:

- **O mesmo toque pode chegar pelas duas vias** na abertura. Cada toque leva o id da notificação, e o
  gancho guarda os já tratados para não empilhar a mesma tela duas vezes. Do lado do adaptador, a resposta
  é esquecida com `clearLastNotificationResponse` assim que é lida.
- **Planta já excluída** não quebra nada: a navegação acontece, o caso de uso não encontra a planta e o
  detalhe mostra "Planta não encontrada".

## Como testar no aparelho

A notificação depende de módulo nativo: ela não aparece na prévia web nem no Expo Go, só num build de
desenvolvimento (`npx expo run:android`). Com o sensor simulado, as leituras variam ao longo do dia e saem da
faixa de parte das espécies:

```bash
EXPO_PUBLIC_SENSOR=simulado npx expo run:android
```

A verificação em segundo plano não cumpre o intervalo pedido num emulador parado; para forçar uma execução, use
o `expo-background-task` pelo painel de desenvolvimento do Expo.

O toque na notificação também só existe num build de desenvolvimento: fora do Android entram os toques
inativos, então no Expo Go e na prévia web ele nunca acontece. A cobertura dele é automatizada, em
`testes/telas/toqueNaNotificacao.test.tsx` e em `testes/unidade/notificacoes.test.ts`.

## Como acrescentar um canal de aviso

1. Crie nesta pasta uma classe que implemente `Notificador`.
2. Acrescente a escolha em [`escolherNotificador.ts`](../../composicao/escolherNotificador.ts).
3. Cubra a classe e a escolha em `testes/unidade/notificacoes.test.ts`.

Nada em `aplicacao/` ou `apresentacao/` muda. O teste `testes/unidade/arquitetura.test.ts` garante que o
domínio não importa Expo nem React Native, e que aplicação e apresentação não importam a infraestrutura.

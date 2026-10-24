# Sensores do ambiente

O domínio pede leituras pela porta [`SensorDeAmbiente`](../../dominio/portas/SensorDeAmbiente.ts), que tem quatro
operações:

| Operação | O que faz |
| --- | --- |
| `lerLeituraAtual()` | Devolve a leitura mais recente (`Leitura`), ou `null` quando ainda não há nenhuma. |
| `observarLeituras(aoReceber)` | Avisa cada leitura nova; devolve uma função que encerra a observação. |
| `consultarEstadoDaConexao()` | Devolve o `EstadoDaConexao`: `indisponivel`, `sem-permissao`, `desconectado`, `conectando` ou `conectado`. |
| `observarConexao(aoMudar)` | Avisa na hora e a cada mudança a `ConexaoDoSensor`: o estado e a hora da última comunicação (a chegada da última leitura). |

O indicador de conexão do detalhe da planta e da tela de pareamento usa `observarConexao`, então muda assim que
o estado muda, sem ficar consultando. Com o sensor Bluetooth, `sem-permissao` aparece quando as permissões de
Bluetooth foram negadas; ao permitir na tela de pareamento, o app reconecta na hora.

Uma `Leitura` tem umidade do ar (%), temperatura (°C), luminosidade (lux) e o momento da medição (`medidaEm`).
A luminosidade é `null` quando o sensor de luz não respondeu mas os outros dois sim: nesse caso a planta fica
"sem dados" (nunca "ok") e a luz não gera aviso de desvio.

## Implementações

| Valor de `EXPO_PUBLIC_SENSOR` | Implementação | Comportamento |
| --- | --- | --- |
| vazio | Depende do ambiente | Em desenvolvimento usa o simulado; em produção usa o Bluetooth. |
| `bluetooth` | [`CentralDeSensoresBluetooth`](CentralDeSensoresBluetooth.ts) | O sensor físico do [firmware](../../../firmware/README.md), por BLE. Sem o módulo nativo (Expo Go, web), vira o indisponível. |
| `indisponivel` ou qualquer outro valor | [`SensorIndisponivel`](SensorIndisponivel.ts) | Nunca tem leitura; as plantas aparecem como "sem dados". |
| `simulado` | [`SensorSimulado`](SensorSimulado.ts) | Para desenvolvimento. Gera leituras de um ambiente de casa que variam ao longo do dia, a cada 5 segundos. |

Para rodar com o sensor simulado:

```bash
EXPO_PUBLIC_SENSOR=simulado npm run web
```

O valor também pode ir num arquivo `.env` na raiz do projeto. Em desenvolvimento, o simulador já é o padrão;
use `EXPO_PUBLIC_SENSOR=indisponivel` para desativá-lo. Depois de mudar o valor, reinicie o Expo com `--clear`
para o app ser montado de novo.
Cada jardim precisa associar um sensor antes de exibir leituras; no desenvolvimento é possível associar seu próprio
sensor simulado pela tela do jardim. Cenários e desconexão do simulador são independentes por jardim. Jardins sem
sensor mostram "sem dados".

Quando o simulador está ativo, a aba **Ajustes** permite escolher independentemente para o jardim selecionado níveis
automáticos, baixos ou altos de umidade, temperatura e luminosidade. As condições podem ser combinadas livremente; há também um
atalho para clima quente, seco e ensolarado e uma opção de desconexão. Esses controles nunca aparecem na
configuração padrão de produção.

## Sensor físico por Bluetooth

**Biblioteca:** [`react-native-ble-plx`](https://github.com/dotintent/react-native-ble-plx). É a biblioteca BLE
mais usada com Expo, tem plugin de configuração próprio (declarado em `app.config.ts`) e cobre tudo o que o
contrato do firmware pede: busca filtrada por serviço, conexão, leitura, notificação e escrita. Como depende de
código nativo, **não roda no Expo Go**: é preciso um development build (`npx expo run:android`). No Expo Go e na
web o app continua abrindo, com o sensor indisponível.

**Como as peças se dividem:**

| Arquivo | Papel |
| --- | --- |
| [`ContratoDoSensor.ts`](ContratoDoSensor.ts) | UUIDs, comando de leitura e tempo limite, copiados do README do firmware. |
| [`DecodificadorDoPacote.ts`](DecodificadorDoPacote.ts) | Pacote de 8 bytes (base64) → temperatura, umidade e luz. Testado contra os pacotes de exemplo do firmware. |
| [`ClienteBle.ts`](ClienteBle.ts) | O pedaço da biblioteca de que o sensor precisa. |
| [`ClienteBlePlx.ts`](ClienteBlePlx.ts) | A implementação com a `react-native-ble-plx` e o pedido de permissões. É o único arquivo que importa a biblioteca, e só é carregado quando o módulo nativo existe. |
| [`SensorBluetooth.ts`](SensorBluetooth.ts) | Implementa `SensorDeAmbiente` e `PareamentoDoSensor` (em `aplicacao/portas/`): conexão, reconexão e pareamento. |
| [`CentralDeSensoresBluetooth.ts`](CentralDeSensoresBluetooth.ts) | Mantém os dispositivos pareados separados e escolhe uma conexão por ID. |
| [`FontesDosJardins.ts`](FontesDosJardins.ts) | Resolve o sensor associado ao jardim; sem associação, usa o indisponível. |

**Pareamento:** na aba **Ajustes**, "Parear sensor" abre a tela que pede as permissões (Bluetooth no Android 12+,
localização no 11 ou antes), procura por 15 s os sensores que anunciam o serviço do FitoSfera e lista do sinal
mais forte para o mais fraco. Todos se chamam `FitoSfera`, então a lista mostra o final do endereço. Tocar num
sensor conecta e espera a primeira leitura (até 20 s); só então é incluído em
`fitosfera:v2:sensores-pareados`. Parear não associa automaticamente o dispositivo ao jardim: a escolha é feita
na tela do jardim. O registro antigo `fitosfera:v2:sensor-pareado` continua legível após atualizar o app.

**Reconexão:** quando o app abre, a primeira leitura pedida pelo jardim conecta ao sensor associado. Se a ligação
cair ou o sensor estiver fora de alcance, o app tenta de novo sozinho, com espera crescente
(`esperaParaReconectar`): 5 s, 10 s, 20 s, 40 s e, dali em diante, a cada 60 s. A espera volta ao começo assim que
uma conexão dá certo. Com o Bluetooth do celular desligado, o app não gasta tentativas: espera a pessoa ligar e
reconecta na hora. A hora da leitura é a da chegada do pacote, porque o firmware não tem relógio.

## Falhas e mensagens

Os erros da `react-native-ble-plx` são traduzidos em [`ClassificadorDeErroBle.ts`](ClassificadorDeErroBle.ts) para
um `FalhaBle`, sem o vocabulário da biblioteca. O `SensorBluetooth` transforma esse tipo no motivo que a interface
mostra: na tela de pareamento, um `MotivoDaFalhaDoPareamento`; durante o uso, o `problema` da `ConexaoDoSensor`,
que o indicador de conexão exibe junto do horário da próxima tentativa. Os textos ficam em
[`textosDoSensor.ts`](../../apresentacao/sensor/textosDoSensor.ts), cada um com o que aconteceu e o que fazer.

| Situação | Código da biblioteca | Ao parear | Durante o uso |
| --- | --- | --- | --- |
| Bluetooth desligado | `BluetoothPoweredOff` (102), ou o estado `PoweredOff` antes de tentar | `bluetooth-desligado`, com atalho para as configurações do Bluetooth | `bluetooth-desligado`; reconecta ao ligar |
| Permissão negada | `BluetoothUnauthorized` (101), `LocationServicesDisabled` (601) | `permissao-negada`, com atalho para as configurações do app | estado `sem-permissao` |
| Fora de alcance | `DeviceConnectionFailed`, `DeviceDisconnected`, `DeviceNotFound`, `DeviceNotConnected` (200–205) | `fora-de-alcance` | `fora-de-alcance`; tenta de novo com espera crescente |
| Tempo esgotado | `OperationTimedOut` (3) | `tempo-esgotado` | `tempo-esgotado`; tenta de novo |
| Falha de leitura | descoberta, leitura, escrita ou notificação (300, 400–403) | `falha-na-leitura` | `falha-na-leitura`; tenta de novo |
| Conectou, mas nenhum pacote em 20 s | — | `sem-leitura` | — |
| Qualquer outro erro | — | `falha-na-conexao` | `fora-de-alcance` |

O firmware aceita **um celular por vez** e, enquanto houver um conectado, para de anunciar. Por isso a mensagem de
"fora de alcance" também lembra de conferir se outro celular não está ocupando o sensor.

Para testar com o sensor no desenvolvimento:

```bash
EXPO_PUBLIC_SENSOR=bluetooth npx expo run:android
```

## Como acrescentar um sensor

1. Crie nesta pasta uma classe que implemente `SensorDeAmbiente`, como o `SensorBluetooth`.
2. Acrescente o valor correspondente em [`escolherSensor.ts`](../../composicao/escolherSensor.ts).
3. Cubra a classe e a escolha em `testes/unidade/sensores.test.ts`.

Nada em `aplicacao/` ou `apresentacao/` muda. O teste `testes/unidade/arquitetura.test.ts` garante que o domínio
não importa Expo, React Native, BLE ou AsyncStorage, e que aplicação e apresentação não importam a
infraestrutura.

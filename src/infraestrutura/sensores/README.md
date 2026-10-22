# Sensores do ambiente

O domínio pede leituras pela porta [`SensorDeAmbiente`](../../dominio/portas/SensorDeAmbiente.ts), que tem três
operações:

| Operação | O que faz |
| --- | --- |
| `lerLeituraAtual()` | Devolve a leitura mais recente (`Leitura`), ou `null` quando ainda não há nenhuma. |
| `observarLeituras(aoReceber)` | Avisa cada leitura nova; devolve uma função que encerra a observação. |
| `consultarEstadoDaConexao()` | Devolve o `EstadoDaConexao`: `indisponivel`, `desconectado`, `conectando` ou `conectado`. |

Uma `Leitura` tem umidade do ar (%), temperatura (°C), luminosidade (lux) e o momento da medição (`medidaEm`).
A luminosidade é `null` quando o sensor de luz não respondeu mas os outros dois sim: nesse caso a planta fica
"sem dados" (nunca "ok") e a luz não gera aviso de desvio.

## Implementações

| Valor de `EXPO_PUBLIC_SENSOR` | Implementação | Comportamento |
| --- | --- | --- |
| vazio | Depende do ambiente | Em desenvolvimento usa o simulado; em produção usa o Bluetooth. |
| `bluetooth` | [`SensorBluetooth`](SensorBluetooth.ts) | O sensor físico do [firmware](../../../firmware/README.md), por BLE. Sem o módulo nativo (Expo Go, web), vira o indisponível. |
| `indisponivel` ou qualquer outro valor | [`SensorIndisponivel`](SensorIndisponivel.ts) | Nunca tem leitura; as plantas aparecem como "sem dados". |
| `simulado` | [`SensorSimulado`](SensorSimulado.ts) | Para desenvolvimento. Gera leituras de um ambiente de casa que variam ao longo do dia, a cada 5 segundos. |

Para rodar com o sensor simulado:

```bash
EXPO_PUBLIC_SENSOR=simulado npm run web
```

O valor também pode ir num arquivo `.env` na raiz do projeto. Em desenvolvimento, o simulador já é o padrão;
use `EXPO_PUBLIC_SENSOR=indisponivel` para desativá-lo. Depois de mudar o valor, reinicie o Expo com `--clear`
para o app ser montado de novo.

Quando o simulador está ativo, a aba **Ajustes** permite escolher independentemente níveis automáticos, baixos
ou altos de umidade, temperatura e luminosidade. As condições podem ser combinadas livremente; há também um
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

**Pareamento:** na aba **Ajustes**, "Parear sensor" abre a tela que pede as permissões (Bluetooth no Android 12+,
localização no 11 ou antes), procura por 15 s os sensores que anunciam o serviço do FitoSfera e lista do sinal
mais forte para o mais fraco. Todos se chamam `FitoSfera`, então a lista mostra o final do endereço. Tocar num
sensor conecta e espera a primeira leitura (até 20 s); só então o sensor é guardado em
`fitosfera:v2:sensor-pareado`.

**Reconexão:** quando o app abre, a primeira leitura pedida pelo jardim conecta ao sensor guardado. Se a ligação
cair ou o sensor estiver fora de alcance, o app tenta de novo a cada 10 s. A hora da leitura é a da chegada do
pacote, porque o firmware não tem relógio.

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

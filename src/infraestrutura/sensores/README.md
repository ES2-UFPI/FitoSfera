# Sensores do ambiente

O domínio pede leituras pela porta [`SensorDeAmbiente`](../../dominio/portas/SensorDeAmbiente.ts), que tem três
operações:

| Operação | O que faz |
| --- | --- |
| `lerLeituraAtual()` | Devolve a leitura mais recente (`Leitura`), ou `null` quando ainda não há nenhuma. |
| `observarLeituras(aoReceber)` | Avisa cada leitura nova; devolve uma função que encerra a observação. |
| `consultarEstadoDaConexao()` | Devolve o `EstadoDaConexao`: `indisponivel`, `desconectado`, `conectando` ou `conectado`. |

Uma `Leitura` tem umidade do ar (%), temperatura (°C), luminosidade (lux) e o momento da medição (`medidaEm`).

## Implementações

| Valor de `EXPO_PUBLIC_SENSOR` | Implementação | Comportamento |
| --- | --- | --- |
| vazio | Depende do ambiente | Em desenvolvimento usa o simulado; em produção usa o indisponível. |
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

## Como acrescentar um sensor

1. Crie nesta pasta uma classe que implemente `SensorDeAmbiente`, por exemplo `SensorBluetooth`.
2. Acrescente o valor correspondente em [`escolherSensor.ts`](../../composicao/escolherSensor.ts).
3. Cubra a classe e a escolha em `testes/unidade/sensores.test.ts`.

Nada em `aplicacao/` ou `apresentacao/` muda. O teste `testes/unidade/arquitetura.test.ts` garante que o domínio
não importa Expo, React Native, BLE ou AsyncStorage, e que aplicação e apresentação não importam a
infraestrutura.

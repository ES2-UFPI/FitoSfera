# Monitor Ambiental com ESP32

Protótipo de nó sensor IoT para monitoramento de condições ambientais de cultivo, desenvolvido para a disciplina de Tópicos em Sistemas Computacionais — UFPI.

---

## Objetivo

Construir um dispositivo capaz de medir temperatura, umidade relativa do ar e luminosidade de um ambiente, e transmiti-las por Bluetooth Low Energy (BLE) a um aplicativo no celular.

---

## Hardware

### Microcontrolador

**ESP32 DevKit V1 (módulo ESP32-WROOM-32)**

### Sensores

**DHT11 — temperatura e umidade relativa** (GPIO18)

**BH1750 (módulo GY-302) — luminosidade em lux**, via I2C (endereço 0x23). Mede de 1 a 65.535 lux no modo padrão; o firmware reduz a sensibilidade (MTreg = 31) para alcançar cerca de 120 mil lux, cobrindo sol pleno. A incerteza declarada pelo fabricante é de ±20 %.

---

## Dimensionamento elétrico

### Orçamento de corrente

O dispositivo fica sempre ligado, com a CPU a 80 MHz e o BLE anunciando ou conectado o tempo todo. Os valores abaixo são estimativas, ainda não medidas no circuito.

| Componente | Corrente |
|---|---|
| ESP32 (CPU a 80 MHz, BLE ativo) | ~35 a 45 mA |
| DHT11 | ~1,5 mA |
| BH1750 | ~0,2 mA |
| **Total estimado** | **~40 a 50 mA** |

Os picos de transmissão BLE ficam em torno de 130 mA, cerca de 26 % da capacidade de 500 mA de uma porta USB 2.0.

**Alimentação.** Nesse regime, uma bateria de 2000 mAh dura menos de 2 dias, então o protótipo deve ser alimentado por um carregador USB (5 V, 1 A ou mais). Em power banks, atenção: muitos desligam sozinhos com cargas abaixo de ~50 a 100 mA. A placa DevKit consome ainda ~3 a 10 mA só com o regulador, o chip USB-serial e o LED de energia, o que limita o ganho de qualquer modo de economia na placa como está.

---

## Firmware

Desenvolvido em C++ sobre o framework Arduino, com PlatformIO no VSCode como ambiente de build.

### Estrutura

```
FitoSfera-Topicos/
├── platformio.ini
├── intrucoes_montagem.md   (ligação dos fios na protoboard)
├── README.md
└── src/
    └── main.cpp
```

### Configuração

A velocidade de gravação foi reduzida para 115200, porque 460800 falhou com o cabo e a porta usados.

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
upload_speed = 115200
build_flags =
    -DCONFIG_BT_NIMBLE_MAX_CONNECTIONS=1
lib_deps =
    adafruit/DHT sensor library@^1.4.6
    adafruit/Adafruit Unified Sensor@^1.1.14
    claws/BH1750@^1.3.0
    h2zero/NimBLE-Arduino@^1.4.3
```

### Contrato BLE

O ESP32 anuncia com o nome `FitoSfera` e expõe um serviço com uma característica de leitura e notificação e uma característica de comando. O firmware atual publica uma medição automática a cada **5 min**, além de enviar uma medição imediata quando o app assina as notificações ou pede uma leitura. O dispositivo fica sempre ligado e conectável.

| Item | UUID |
|---|---|
| Serviço | `f1705f3a-0001-4c7e-9a5b-3d0a6e2b9c10` |
| Característica de leitura (READ, NOTIFY) | `f1705f3a-0002-4c7e-9a5b-3d0a6e2b9c10` |
| Característica de comando (WRITE, WRITE sem resposta) | `f1705f3a-0003-4c7e-9a5b-3d0a6e2b9c10` |

**Comandos do app.** A característica de comando aceita:

| Bytes | Ação |
|---|---|
| `01` | mede e envia agora; o próximo intervalo automático começa após essa medição |
| `02 seq` | confirma que o app recebeu e processou o pacote com o número de sequência `seq` |

O pacote confirmado zera o contador de segundos sem confirmação. O app precisa estar inscrito na característica de leitura para receber notificações. Se uma medição falhar, o firmware tenta novamente em 5 s, até 3 vezes; ao esgotar as tentativas, publica os campos disponíveis com sentinelas para as medições ausentes.

O firmware atual envia pacotes de **19 bytes**, em little-endian:

| Bytes | Campo | Tipo | Unidade |
|---|---|---|---|
| 0 | sequência | `uint8` | identificador do pacote (volta a 0 após 255) |
| 1–2 | id do reinício | `uint16` | muda a cada inicialização do ESP32 |
| 3–6 | luz acumulada | `uint32` | lux × minutos desde que o ESP32 ligou |
| 7–10 | segundos sem confirmação | `uint32` | segundos desde a última confirmação válida do app |
| 11–12 | temperatura | `int16` | centésimos de °C (`0x8000` = sem leitura) |
| 13–14 | umidade | `uint16` | centésimos de % (`0xFFFF` = sem leitura) |
| 15–18 | luminosidade atual | `uint32` | lux (`0xFFFFFFFF` = sem leitura) |

O campo de luz acumulada é um contador do tempo de execução do ESP32; reinicia com o dispositivo e identifica esse reinício pelo campo `id do reinício`. Ele não é, por si só, o acumulado diário da planta.

O app também aceita o formato legado de 8 bytes enquanto houver firmware antigo em uso:

| Bytes | Campo | Tipo | Unidade |
|---|---|---|---|
| 0–1 | temperatura | `int16` | centésimos de °C |
| 2–3 | umidade | `uint16` | centésimos de % |
| 4–7 | luminosidade | `uint32` | lux (`0xFFFFFFFF` = sem leitura) |

**Pacotes de exemplo** (casos de teste para o decodificador do aplicativo; a biblioteca BLE do app costuma entregar o valor em base64):

| Caso | Bytes (hex) | Base64 | Valores |
|---|---|---|---|
| Legado normal | `D2 09 A8 16 E8 03 00 00` | `0gmoFugDAAA=` | 25,14 °C, 58,00 %, 1000 lux |
| Novo normal (seq 42, reinício `0x1234`) | `2A 34 12 06 12 0F 00 41 01 00 00 D2 09 A8 16 E8 03 00 00` | `KjQSBhIPAEEBAADSCagW6AMAAA==` | 25,14 °C, 58,00 %, 1000 lux |
| Novo sem leituras de temperatura, umidade e luz | `2A 34 12 06 12 0F 00 41 01 00 00 00 80 FF FF FF FF FF FF` | `KjQSBhIPAEEBAAAAgP///////w==` | sensores sem leitura |
| Sem leitura ainda | (vazio, 0 bytes) | (vazio) | nenhuma leitura |

O comando de leitura imediata é `0x01` (`AQ==` em base64). A confirmação leva dois bytes: `0x02` seguido da sequência do pacote.

O app só publica uma `Leitura` quando temperatura e umidade estão presentes; luz ausente é `null`. Ainda assim, confirma um pacote novo válido com campo de temperatura ou umidade ausente, para que o ESP32 não o reenvie indefinidamente. A mesma sequência e id de reinício não geram leitura duplicada quando o pacote chega por `READ` e `NOTIFY`.

- Antes da primeira medição, a característica fica vazia (0 bytes), que o app interpreta como "ainda não há leitura".
- O ESP32 não tem relógio: o app marca `medidaEm` ao receber o pacote. Um valor lido diretamente pode ser antigo; para pedir uma medição atual, escreva `0x01` e aguarde a notificação.
- A primeira medição sai cerca de 2 s após ligar ou assim que o app assina as notificações.
- Só **1 celular** pode ficar conectado por vez. Enquanto houver uma conexão, o ESP32 não anuncia e não aparece para outros aparelhos. Ele volta a anunciar quando a conexão cai.

O decodificador legado de referência em TypeScript:

```ts
const LUX_AUSENTE = 0xffffffff;

interface PacoteDoSensor {
  temperaturaCelsius: number;
  umidadePercentual: number;
  luminosidadeLux: number | null; // null = BH1750 sem leitura
}

/** Decodifica o pacote legado de 8 bytes (little-endian). */
function decodificarPacote(bytes: Uint8Array): PacoteDoSensor | null {
  if (bytes.length !== 8) return null;
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const lux = v.getUint32(4, true);
  return {
    temperaturaCelsius: v.getInt16(0, true) / 100,
    umidadePercentual: v.getUint16(2, true) / 100,
    luminosidadeLux: lux === LUX_AUSENTE ? null : lux,
  };
}
```

### Decisões de implementação

**Temporização não bloqueante.** O controle de intervalo entre leituras usa comparação sobre `millis()` em vez de `delay()`. A chamada bloqueante congela o processador por completo, impedindo qualquer outra tarefa. Como a evolução prevista inclui gerenciamento de conexão BLE e tratamento de eventos, a abordagem não bloqueante evita a reescrita do laço principal.

**Tratamento de falha de leitura.** O DHT11 retorna `NaN` em caso de falha de comunicação, ocorrência esperada em uma fração das leituras. A verificação por `isnan()` impede a propagação de valores inválidos. No pacote de 19 bytes, cada grandeza ausente tem seu próprio sentinela, então a falha de uma medição não apaga as demais.

**Nova tentativa rápida.** Se o DHT11 ou o BH1750 falharem numa leitura, o firmware tenta de novo em 5 s, até 3 vezes, antes de voltar ao intervalo de 5 min. Isso vale também para leituras pedidas pelo app. Depois das tentativas, envia os valores disponíveis e marca os ausentes com os sentinelas do contrato.

**CPU a 80 MHz.** O firmware reduz a frequência da CPU de 240 para 80 MHz (o mínimo com BLE) logo no início do `setup()`. A carga é leve (dois sensores a cada 5 min), e a redução diminui o consumo ativo. O ganho ainda não foi medido no circuito; os valores do orçamento de corrente acima correspondem a 240 MHz e devem ser reavaliados com um medidor.

**Periférico opcional.** Na inicialização, o firmware lista no monitor serial os endereços I2C encontrados. Se o BH1750 não responder, o firmware avisa e continua, em vez de travar.

---

## Metodologia de construção

A montagem seguiu validação incremental, com cada camada testada isoladamente antes da integração:

1. Verificação da cadeia de compilação e gravação (blink no LED interno)
2. Validação da comunicação serial
3. Leitura do DHT11 isolada
4. Varredura I2C e leitura do BH1750
5. Anúncio BLE e leitura da característica com um app genérico (nRF Connect)
6. Integração completa e conexão com o aplicativo

---

## Limitações reconhecidas

**Precisão do DHT11.** A resolução de 1 °C e 1 %, com incerteza de ±2 °C, é adequada para detecção de tendências mas insuficiente para caracterização fina de microclima. O DHT22 ou o BME280 são substitutos pino-compatíveis quando maior precisão for necessária.

**Ausência de referência temporal.** O dispositivo não tem relógio, e a serial mostra só o tempo desde a inicialização. A hora da medição é carimbada pelo aplicativo ao receber o pacote; uma leitura guardada na característica pode ser do último ciclo automático (até cerca de 5 min). O app pode pedir uma nova medição e esperar a notificação.

**Sem pareamento nem segurança.** O firmware não faz *bonding*: qualquer celular ao alcance pode conectar e ler os dados, e quem conectar primeiro ocupa a única vaga. O primeiro uso (escolher o dispositivo certo entre os que estiverem por perto) e a restrição ao celular do dono ainda não foram implementados.

**Autonomia.** Sempre ligado, o consumo estimado inviabiliza bateria (menos de 2 dias com 2000 mAh). O ganho dos 80 MHz ainda não foi medido.

**Incerteza do BH1750.** O fabricante declara variação de ±20 % na medição de lux. É adequado para comparar o ambiente com as faixas de luminosidade das espécies, mas não substitui um luxímetro calibrado. Com a sensibilidade reduzida (MTreg = 31) para alcançar sol pleno, a resolução em luz fraca é um pouco menor.

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
firmware/
├── platformio.ini
├── instrucoes_montagem.md   (ligação dos fios na protoboard)
├── README.md
└── src/
    └── main.cpp
```

Para gravar, abra a pasta `firmware/` no VSCode com a extensão PlatformIO e use **Upload**. O app consome o
contrato abaixo em [`src/infraestrutura/sensores/`](../src/infraestrutura/sensores/README.md); mudar UUIDs ou o
formato do pacote exige mudar `ContratoDoSensor.ts` e `DecodificadorDoPacote.ts` junto.

### Configuração

A velocidade de gravação foi reduzida para 115200, porque 460800 falhou com o cabo e a porta usados.

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
upload_speed = 115200
lib_deps =
    adafruit/DHT sensor library@^1.4.6
    adafruit/Adafruit Unified Sensor@^1.1.14
    claws/BH1750@^1.3.0
    h2zero/NimBLE-Arduino@^1.4.3
```

### Contrato BLE

O ESP32 anuncia com o nome `FitoSfera` e expõe um serviço com uma característica de leitura e notificação, atualizada **a cada 60 s**, e uma característica de comando para pedir uma leitura na hora. O dispositivo fica sempre ligado e conectável.

| Item | UUID |
|---|---|
| Serviço | `f1705f3a-0001-4c7e-9a5b-3d0a6e2b9c10` |
| Característica de leitura (READ, NOTIFY) | `f1705f3a-0002-4c7e-9a5b-3d0a6e2b9c10` |
| Característica de comando (WRITE, WRITE sem resposta) | `f1705f3a-0003-4c7e-9a5b-3d0a6e2b9c10` |

**Gatilho do app.** Qualquer escrita na característica de comando (um byte, por exemplo `0x01`) faz o ESP32 medir e notificar imediatamente, fora do intervalo de 60 s, e o relógio dos 60 s recomeça a partir daí. A resposta chega como notificação na característica de leitura, então o app precisa estar inscrito nela. Se o DHT11 falhar, o firmware tenta de novo em 5 s (até 3 vezes); se todas falharem, não há resposta, e o app deve usar um tempo limite (sugestão: ~20 s).

Cada notificação é uma leitura completa de 8 bytes, em little-endian:

| Bytes | Campo | Tipo | Unidade |
|---|---|---|---|
| 0–1 | temperatura | `int16` | centésimos de °C |
| 2–3 | umidade | `uint16` | centésimos de % |
| 4–7 | luminosidade | `uint32` | lux (`0xFFFFFFFF` = sem leitura) |

**Pacotes de exemplo** (casos de teste para o decodificador do aplicativo; a biblioteca BLE do app costuma entregar o valor em base64):

| Caso | Bytes (hex) | Base64 | Valores |
|---|---|---|---|
| Normal | `D2 09 A8 16 E8 03 00 00` | `0gmoFugDAAA=` | 25,14 °C, 58,00 %, 1000 lux |
| Temperatura negativa, sol forte | `A2 FE 40 1F C0 D4 01 00` | `ov5AH8DUAQA=` | −3,50 °C, 80,00 %, 120000 lux |
| BH1750 sem leitura | `D2 09 A8 16 FF FF FF FF` | `0gmoFv////8=` | 25,14 °C, 58,00 %, luz ausente |
| Sem leitura ainda | (vazio, 0 bytes) | (vazio) | nenhuma leitura |

O comando de leitura imediata é um byte qualquer, por exemplo `0x01` (`AQ==` em base64).

Decodificador de referência em TypeScript, conferido contra os três pacotes acima:

```ts
const LUX_AUSENTE = 0xffffffff;

interface PacoteDoSensor {
  temperaturaCelsius: number;
  umidadePercentual: number;
  luminosidadeLux: number | null; // null = BH1750 sem leitura
}

/** Decodifica o pacote de 8 bytes (little-endian). Vazio ou de outro tamanho: null. */
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

- O pacote só é publicado quando o DHT11 responde. Se ele falhar, nada é enviado, e o aplicativo trata a ausência como "sem dados".
- Se só o BH1750 falhar, o pacote sai normalmente com a luminosidade em `0xFFFFFFFF`, que o aplicativo deve exibir como "sem leitura de luz". O firmware tenta reconectar o sensor a cada ciclo.
- Antes da primeira leitura válida, a característica fica vazia (0 bytes), o que o aplicativo deve interpretar como "ainda não há leitura".
- O dispositivo não tem relógio: o aplicativo carimba a hora da medição ao receber o pacote. Uma leitura lida (READ) pode ter até 60 s; para um valor fresco, use o comando e aguarde a notificação.
- A primeira leitura sai ~2 s após ligar.
- Até **3 celulares** podem ficar conectados ao mesmo tempo. O ESP32 continua anunciando enquanto houver vaga e volta a anunciar quando uma conexão cai. A notificação de leitura vai para todos que a assinaram, inclusive a resposta ao comando de um deles.

### Decisões de implementação

**Temporização não bloqueante.** O controle de intervalo entre leituras usa comparação sobre `millis()` em vez de `delay()`. A chamada bloqueante congela o processador por completo, impedindo qualquer outra tarefa. Como a evolução prevista inclui gerenciamento de conexão BLE e tratamento de eventos, a abordagem não bloqueante evita a reescrita do laço principal.

**Tratamento de falha de leitura.** O DHT11 retorna `NaN` em caso de falha de comunicação, ocorrência esperada em uma fração das leituras. A verificação por `isnan()` impede a propagação de valores inválidos. O pacote BLE só sai com temperatura e umidade válidas; a falta da luminosidade é sinalizada pelo valor `0xFFFFFFFF`, sem bloquear as demais medidas.

**Nova tentativa rápida.** Se o DHT11 ou o BH1750 falharem numa leitura, o firmware tenta de novo em 5 s, até 3 vezes, antes de voltar ao intervalo de 60 s. Isso vale também para leituras pedidas pelo app, que assim recebe a resposta mesmo após uma falha pontual. Se só o BH1750 falhar, o pacote sem luz sai uma única vez por ciclo; se uma nova tentativa recuperar o sensor, sai o pacote completo. Com um sensor desconectado de vez, o ciclo de tentativas se repete a cada 60 s, sem notificações extras.

**CPU a 80 MHz.** O firmware reduz a frequência da CPU de 240 para 80 MHz (o mínimo com BLE) logo no início do `setup()`. A carga é leve (dois sensores a cada 60 s), e a redução diminui o consumo ativo. O ganho ainda não foi medido no circuito; os valores do orçamento de corrente acima correspondem a 240 MHz e devem ser reavaliados com um medidor.

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

**Ausência de referência temporal.** O dispositivo não tem relógio, e a serial mostra só o tempo desde a inicialização. A hora da medição é carimbada pelo aplicativo ao receber o pacote, o que atribui uma defasagem de até 60 s a uma leitura lida direto (READ).

**Sem pareamento nem segurança.** O firmware não faz *bonding*: qualquer celular ao alcance pode conectar e ler os dados, e o dispositivo aceita até 3 conexões simultâneas. O primeiro uso (escolher o dispositivo certo entre os que estiverem por perto) e a restrição ao celular do dono ainda não foram implementados.

**Autonomia.** Sempre ligado, o consumo estimado inviabiliza bateria (menos de 2 dias com 2000 mAh). O ganho dos 80 MHz ainda não foi medido.

**Incerteza do BH1750.** O fabricante declara variação de ±20 % na medição de lux. É adequado para comparar o ambiente com as faixas de luminosidade das espécies, mas não substitui um luxímetro calibrado. Com a sensibilidade reduzida (MTreg = 31) para alcançar sol pleno, a resolução em luz fraca é um pouco menor.

---

## Próximas etapas

- Recebimento em segundo plano no aplicativo. O adaptador BLE e o primeiro uso (o app lista os `FitoSfera` por perto e a pessoa escolhe o seu) já existem; ver a #47. No Expo, o BLE exige um *development build*, e não o Expo Go.
- Restringir a conexão ao celular do dono (pareamento com *bonding*, talvez com um botão que abre o modo de pareamento).
- Medir a corrente real do circuito e, se necessário, avaliar *light sleep* com BLE conectado, que mantém o dispositivo alcançável. O *deep sleep* economiza mais, mas desliga o rádio entre os ciclos, e o aplicativo não consegue pedir leituras nesse intervalo.

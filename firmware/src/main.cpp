#include <Arduino.h>
#include <Wire.h>
#include <DHT.h>
#include <BH1750.h>
#include <NimBLEDevice.h>

#define PINO_DHT      18
#define TIPO_DHT      DHT11

// Barramento I2C do BH1750
#define PINO_SDA      21
#define PINO_SCL      22
#define ENDERECO_LUX  0x23   // BH1750 com o pino ADDR solto 

// Reduz a sensibilidade do BH1750 para medir acima de 65535 lux (sol pleno)
// 69 é o padrão do chip (teto ~54 mil lux); 31 leva o teto a ~120 mil lux
#define MTREG_LUX     31

// Valor enviado no campo de luz quando o BH1750 não responde
#define LUX_AUSENTE   0xFFFFFFFFu

const char* NOME_BLE     = "FitoSfera";
#define UUID_SERVICO  "f1705f3a-0001-4c7e-9a5b-3d0a6e2b9c10"
#define UUID_LEITURA  "f1705f3a-0002-4c7e-9a5b-3d0a6e2b9c10"
#define UUID_COMANDO  "f1705f3a-0003-4c7e-9a5b-3d0a6e2b9c10"

const unsigned long INTERVALO_MS = 60000;
// Se algum sensor falhar, tenta de novo logo, até MAX_TENTATIVAS vezes, antes de esperar o intervalo normal
const unsigned long REPETICAO_MS = 5000;
const int MAX_TENTATIVAS = 3;
int tentativas = 0;
bool pacoteParcialEnviado = false;
// A primeira leitura sai 2 s após ligar, tempo de estabilizar o DHT11
unsigned long proximaLeitura = 2000;
// Ligado pelo gatilho do app (escrita no comando); o loop mede e notifica na hora
volatile bool pedidoDoApp = false;

DHT dht(PINO_DHT, TIPO_DHT);
BH1750 sensorLuz(ENDERECO_LUX);

bool luzOk = false;
NimBLEServer* servidorBle = nullptr;
NimBLECharacteristic* caracteristicaLeitura = nullptr;

class CallbacksDoServidor : public NimBLEServerCallbacks {
  // O NimBLE para de anunciar quando o celular conecta; ao desconectar, volta a anunciar
  void onDisconnect(NimBLEServer*) override { NimBLEDevice::startAdvertising(); }
};

// Qualquer escrita na característica de comando pede uma medição imediata
class CallbacksDoComando : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic*) override { pedidoDoApp = true; }
};

bool existeNoBarramento(uint8_t endereco) {
  Wire.beginTransmission(endereco);
  return Wire.endTransmission() == 0;
}

void listarDispositivosI2C() {
  Serial.print("# I2C:");
  int achados = 0;
  for (uint8_t endereco = 1; endereco < 127; endereco++) {
    if (existeNoBarramento(endereco)) {
      Serial.printf(" 0x%02X", endereco);
      achados++;
    }
  }
  Serial.println(achados ? "" : " nenhum dispositivo");
}

void iniciarBle() {
  NimBLEDevice::init(NOME_BLE);
  servidorBle = NimBLEDevice::createServer();
  servidorBle->setCallbacks(new CallbacksDoServidor());

  NimBLEService* servico = servidorBle->createService(UUID_SERVICO);
  caracteristicaLeitura = servico->createCharacteristic(
      UUID_LEITURA, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);

  NimBLECharacteristic* comando = servico->createCharacteristic(
      UUID_COMANDO, NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR);
  comando->setCallbacks(new CallbacksDoComando());

  servico->start();

  NimBLEAdvertising* anuncio = NimBLEDevice::getAdvertising();
  anuncio->addServiceUUID(UUID_SERVICO);
  anuncio->setScanResponse(true);
  anuncio->start();
}

// Pacote de 8 bytes, little-endian:
//   [0..1] temperatura, int16, centésimos de °C
//   [2..3] umidade,     uint16, centésimos de %
//   [4..7] luz,         uint32, lux (LUX_AUSENTE se o BH1750 falhar)
void publicarLeitura(float temp, float umid, float lux) {
  int16_t  t = (int16_t)lroundf(temp * 100.0f);
  uint16_t u = (uint16_t)lroundf(umid * 100.0f);
  uint32_t l = isnan(lux) ? LUX_AUSENTE : (uint32_t)lroundf(lux);

  uint8_t pacote[8] = {
    (uint8_t)(t & 0xFF), (uint8_t)((t >> 8) & 0xFF),
    (uint8_t)(u & 0xFF), (uint8_t)((u >> 8) & 0xFF),
    (uint8_t)(l & 0xFF), (uint8_t)((l >> 8) & 0xFF),
    (uint8_t)((l >> 16) & 0xFF), (uint8_t)((l >> 24) & 0xFF),
  };

  caracteristicaLeitura->setValue(pacote, sizeof(pacote));
  // Notifica o celular conectado, se ele tiver assinado a característica
  if (servidorBle->getConnectedCount() > 0) caracteristicaLeitura->notify();
}

bool iniciarLuz() {
  return existeNoBarramento(ENDERECO_LUX) &&
         sensorLuz.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, ENDERECO_LUX, &Wire) &&
         sensorLuz.setMTreg(MTREG_LUX);
}

void setup() {
  // 80 MHz é o mínimo com BLE e basta para esse caso
  setCpuFrequencyMhz(80);
  Serial.begin(115200);
  Wire.begin(PINO_SDA, PINO_SCL);

  Serial.println();
  listarDispositivosI2C();

  dht.begin();

  luzOk = iniciarLuz();
  if (!luzOk) Serial.println("# BH1750 nao encontrado; seguindo sem luz");

  iniciarBle();

  Serial.println("tempo_s, temp_c, umidade_pct, lux");
}

void loop() {
  bool pedido = pedidoDoApp;
  if (!pedido && (long)(millis() - proximaLeitura) < 0) return;
  pedidoDoApp = false;

  float temp = dht.readTemperature();
  float umid = dht.readHumidity();
  float lux  = NAN;
  // Tenta de novo a cada ciclo, para o sensor voltar sem precisar de reset
  if (!luzOk && (luzOk = iniciarLuz())) Serial.println("# BH1750 encontrado");
  if (luzOk) {
    float medida = sensorLuz.readLightLevel();
    if (medida >= 0) lux = medida;
  }

  if (isnan(temp) || isnan(umid)) Serial.println("# leitura invalida do DHT11");
  if (luzOk && isnan(lux))        Serial.println("# leitura invalida do BH1750");

  bool dhtOk = !isnan(temp) && !isnan(umid);
  bool completo = dhtOk && !isnan(lux);

  // Sem o DHT11 não há pacote; sem o BH1750 o pacote sai uma vez por ciclo, com LUX_AUSENTE
  if (dhtOk && (completo || !pacoteParcialEnviado)) {
    publicarLeitura(temp, umid, lux);
    pacoteParcialEnviado = !completo;
    if (isnan(lux)) Serial.printf("%lu, %.1f, %.1f,\n", millis() / 1000, temp, umid);
    else            Serial.printf("%lu, %.1f, %.1f, %.0f\n", millis() / 1000, temp, umid, lux);
  }

  if (!completo && tentativas < MAX_TENTATIVAS) {
    tentativas++;
    proximaLeitura = millis() + REPETICAO_MS;
    Serial.printf("# nova tentativa em %lu s (%d/%d)\n", REPETICAO_MS / 1000, tentativas, MAX_TENTATIVAS);
  } else {
    tentativas = 0;
    pacoteParcialEnviado = false;
    proximaLeitura = millis() + INTERVALO_MS;
  }
}

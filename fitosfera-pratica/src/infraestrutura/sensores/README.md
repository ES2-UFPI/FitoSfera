# infraestrutura/sensores

- `AdaptadorSensorSimulado` — valores plausíveis para desenvolver sem hardware.
- `AdaptadorSensorHttp` — consulta o dispositivo real (`GET /leituras`) por HTTP/BLE.
- `FabricaDeSensor` (Factory) — registro de `FonteRegistrada`; monta o par
  `LeitorDeSensor`/`MonitorDeSensor` a partir da preferência do usuário.
- `MapeadorDeRespostaDoSensor` — JSON do dispositivo -> `LeituraAmbiental`.

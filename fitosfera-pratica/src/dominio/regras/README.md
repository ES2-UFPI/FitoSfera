# dominio/regras

Strategy das verificações de cuidado.

- `RegraDeCuidado` (interface) e `RegraDeFaixaAmbiental` (abstrata)
- `RegraUmidadeAmbiente`, `RegraTemperatura`, `RegraLuminosidade`, `RegraIntervaloDeRega`
- `AvaliadorDeCuidados` — percorre as regras recebidas no construtor, sem conhecer nenhuma
  implementação concreta.

# Regras de domínio

## Estimativa conservadora de colheita

`EstimadorDeColheitaPorCondicoes` parte de `tempoMedioAteColheitaEmDias` do catálogo. As condições ambientais
podem apenas atrasar a estimativa: o fator aplicado vai de 1,0 a 1,3. O atraso é proporcional ao tempo observado
fora das faixas de temperatura e umidade da espécie:

```text
ciclo estimado = ciclo médio × (1 + 0,30 × proporção observada fora do ideal)
dias restantes = máximo(0, teto(ciclo estimado − dias de calendário desde o cadastro))
```

O intervalo das faixas é inclusivo. Entre 6h e 18h são usadas as faixas diurnas; fora desse período, as noturnas.
Leituras inválidas e futuras são ignoradas. Cada leitura representa no máximo 30 minutos, ou até a próxima leitura,
o que ocorrer primeiro; períodos sem leitura não são inferidos como bons nem ruins. Só os 24h anteriores ao instante
de referência entram no cálculo. É necessário acumular ao menos 6h de cobertura válida para aplicar o fator. Abaixo
disso, a estimativa usa o ciclo médio sem ajuste. Sem faixa ideal disponível, também se usa a média sem ajuste.

O resultado indica `ajustada: true` quando há cobertura suficiente para avaliar as condições, mesmo que todas as
leituras estejam ideais e o ciclo continue igual à média. Sem data de cadastro ou ciclo médio positivo e finito, a
estimativa fica indisponível.

Este modelo é uma heurística inicial para orientar o usuário, não uma previsão agronômica. O app atualmente mantém
em cache apenas a leitura mais recente; portanto, o cálculo ambiental só pode ser ajustado quando o chamador fornecer
uma sequência recente de leituras. A ausência desse histórico resulta no prazo médio não ajustado.

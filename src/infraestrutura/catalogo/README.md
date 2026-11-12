# Catálogo de espécies

O arquivo [`catalogo-plantas.json`](catalogo-plantas.json) é a lista de espécies que o app conhece. Ele vai
embutido no bundle e é lido por [`RepositorioDeEspeciesLocal`](RepositorioDeEspeciesLocal.ts), sem acesso à
rede. Alimenta a busca do cadastro, as faixas ideais do painel e, nas próximas histórias, os lembretes de rega
(US08), o nível de dificuldade (US12) e a previsão de colheita (US14).

## Schema de uma espécie

```json
{
  "id": "capim-limao",
  "nomeComum": "Capim-limão",
  "nomeCientifico": "Cymbopogon citratus",
  "nomesAlternativos": ["Capim-santo", "Capim-cidreira"],
  "foto": null,
  "faixasIdeais": {
    "umidadeDoAr": { "minimo": 50, "maximo": 80, "fonte": "..." },
    "temperatura": { "minimo": 20, "maximo": 35, "fonte": "..." },
    "luminosidade": { "minimo": 20000, "maximo": 80000, "fonte": "..." },
    "luzDiaria": { "minimo": 18, "maximo": 30, "fonte": "..." },
    "umidadeDoArNoturna": { "minimo": 50, "maximo": 90, "fonte": "..." },
    "temperaturaNoturna": { "minimo": 15, "maximo": 30, "fonte": "..." }
  },
  "intervaloDeRegaEmDias": 3,
  "nivelDeDificuldade": "facil",
  "cicloAteColheitaEmDias": { "minimo": 120, "maximo": 150 },
  "frutifera": false
}
```

| Campo | Obrigatório | Regra |
| --- | --- | --- |
| `id` | sim | Único no catálogo, em kebab-case e sem acento (`capim-limao`). **Nunca mude o id de uma espécie que já existe**: as plantas cadastradas guardam esse id. |
| `nomeComum` | sim | Nome popular mostrado no app. |
| `nomeCientifico` | sim | Nome científico. Para grupos, use o gênero ou a família (`Phalaenopsis`, `Cactaceae`). |
| `nomesAlternativos` | sim | Outros nomes populares, usados na busca. Pode ser `[]`. |
| `foto` | sim | Caminho de uma imagem em `assets/`, ou `null` enquanto a espécie não tiver foto. |
| `faixasIdeais` | sim | As seis faixas: `umidadeDoAr` (%) e `temperatura` (°C) durante o dia, `luminosidade` num instante (lux), `luzDiaria` somada no dia (DLI, mol/m²/dia), e `umidadeDoArNoturna` (%) e `temperaturaNoturna` (°C) durante a noite. |
| `faixasIdeais.*.minimo` / `maximo` | sim | Números, com `minimo` **menor** que `maximo`. Umidade entre 0 e 100, temperatura entre -10 e 50, luminosidade entre 0 e 120000, luz diária entre 0 e 70. |
| `faixasIdeais.*.fonte` | sim | De onde veio a faixa (instituição e publicação). |
| `intervaloDeRegaEmDias` | sim | Inteiro positivo: de quantos em quantos dias regar em condições normais. |
| `nivelDeDificuldade` | sim | `facil`, `medio` ou `dificil`. |
| `cicloAteColheitaEmDias` | sim | Dias do plantio da muda à primeira colheita das frutíferas (`minimo` ≤ `maximo`), ou `null` para quem não se colhe. Os ciclos das demais espécies ainda são os valores anteriores do catálogo. |
| `frutifera` | sim | `true` para espécies que dão frutos (tomate, morango, pimenta…). Só elas registram colheitas e mostram rendimento (US15). Ter ciclo até a colheita não basta: a alface se colhe e não é frutífera. |
| `tempoMedioAteColheitaEmDias` | nas frutíferas | Inteiro positivo: estimativa desde o plantio da muda até a primeira colheita. |
| `estagiosDeDesenvolvimento` | nas frutíferas | Lista ordenada de `{ "nome": "muda", "duracaoEmDias": 7 }`, com nomes preenchidos e dias inteiros positivos. A soma das durações deve ser igual ao tempo médio. |

O tipo correspondente no domínio é `EspecieVegetal`, em `src/dominio/modelos/EspecieVegetal.ts`.

## Estimativas para espécies frutíferas

O dia zero é o **plantio de uma muda**, não a semeadura. O ciclo termina na **primeira colheita**;
flores e frutos posteriores podem aparecer ao mesmo tempo em plantas que continuam produzindo. Os estágios
`muda`, `crescimento`, `floração` e `frutificação` são uma **distribuição aproximada para exibição** do tempo total:
as publicações não fornecem as quatro durações exatas para cada espécie. A média não representa uma previsão
individual, que depende da cultivar, da estação e das condições de cultivo.

| Espécie | Referência para os dias e interpretação |
| --- | --- |
| Abobrinha | [Oregon State University Extension, *Squash (Summer)*](https://extension.oregonstate.edu/imported-publication/squash-summer): mudas levam cerca de 40–50 dias até a maturidade; referência de 45 dias. |
| Limoeiro (`Citrus × limon`) | [Clemson Extension, *In-Ground Citrus Production*](https://hgic.clemson.edu/factsheet/in-ground-citrus/): limões jovens enxertados levam cerca de 1–3 anos para superar a juvenilidade; [University of Maryland Extension, *Growing Dwarf Citrus*](https://extension.umd.edu/resource/growing-dwarf-citrus): o fruto pode levar 6–9 meses para amadurecer. A faixa aproximada de 545–1365 dias e o ponto médio de 955 dias combinam esses dois intervalos (ano de 365 dias e mês de 30); pressupõem uma muda jovem **enxertada**, não uma árvore já adulta nem uma planta de semente. |
| Morango | [Purdue University, *Planting Bare-root Strawberry Plants*](https://fff.hort.purdue.edu/article/planting-bare-root-strawberry-plants/): cultivar de dia neutro pode produzir em cerca de dois meses após o plantio; [Penn State Extension, *Growing Strawberries*](https://extension.psu.edu/growing-strawberries): fruto amadurece cerca de 28–30 dias após a floração. Média de 60 dias; o máximo de 90 dias já existia no catálogo e é apenas uma margem, não um dado dessas publicações. Não se aplica a cultivares que só produzem no segundo ano. |
| Pimenta (`Capsicum frutescens`) | [Oklahoma State University Extension, *Pepper Production*](https://extension.okstate.edu/fact-sheets/pepper-production): pimentas picantes levam cerca de 100 dias da muda ao fruto verde ou 140 dias ao fruto vermelho. A média de 140 dias considera a pimenta madura/vermelha; a faixa inclui a colheita verde. |
| Pimentão | [University of Georgia Extension, *Home Garden Peppers*](https://fieldreport.caes.uga.edu/publications/C1005/home-garden-peppers/): 70–85 dias desde o transplante; média aproximada de 80 dias para o fruto verde. [Utah State University Extension, *Harvest and Handling*](https://extension.usu.edu/vegetableguide/tomato-pepper-eggplant/harvest-handling): cerca de 30 dias da floração ao pimentão verde. |
| Tomate | [University of Maryland Extension, *Growing Tomatoes in a Home Garden*](https://extension.umd.edu/resource/growing-tomatoes-home-garden): 65–90 dias desde o transplante; [University of Georgia Extension, *Commercial Tomato Production Handbook*](https://fieldreport.caes.uga.edu/publications/B1312/commercial-tomato-production-handbook/): cerca de 75 dias até a primeira colheita; [South Dakota State University Extension, *Will Heat Make My Tomatoes Ripen Faster?*](https://extension.sdstate.edu/will-heat-make-my-tomatoes-ripen-faster): cerca de 42 dias da floração à maturação em condições favoráveis. |

## Como acrescentar uma espécie

1. Copie o bloco de uma espécie parecida em `catalogo-plantas.json` e cole na posição alfabética pelo `id`.
2. Preencha todos os campos da tabela acima. Para as faixas, use uma fonte confiável (Embrapa, extensões
   universitárias, sociedades de horticultura) e escreva essa fonte em `fonte`.
3. Rode a validação:

   ```bash
   npm run validar-catalogo
   ```

   Ela lista cada problema com a posição e o id da espécie, por exemplo
   `espécie 12 (coentro): faixasIdeais.temperatura tem minimo (25) maior ou igual ao maximo (18)`.
4. Abra o pull request. O CI roda a mesma validação e reprova o pull request se o catálogo estiver inválido.

Se a espécie tiver foto, coloque a imagem em `assets/especies/<id>.jpg` e preencha `foto` com esse caminho.

## Luz diária e faixas da noite

A `luzDiaria` é a meta de luz somada ao longo do dia, em DLI (mol/m²/dia), a unidade usada na horticultura. Os
valores seguem a tabela "DLI Needs of Indoor Plants" da Iowa State University Extension, por categoria; a
`fonte` de cada espécie diz a categoria. O `maximo` é o topo da faixa recomendada, não um limite de dano.

| Categoria | DLI | Espécies |
| --- | --- | --- |
| Luz baixa | 3 a 6 | zamioculca, espada-de-são-jorge, jiboia, samambaia |
| Luz média | 6 a 10 | costela-de-adão, antúrio, orquídea, begônia |
| Luz alta | 12 a 16 | folhosas e ervas de folha (alface, rúcula, couve, coentro, salsinha, cebolinha, hortelã, manjericão), suculentas (cacto, suculenta, babosa) e gerânio |
| Luz muito alta | 18 a 30 | hortaliças de fruto e raiz (tomate, pimentão, pimenta, abobrinha, morango, cenoura), limoeiro e ervas de sol pleno (alecrim, lavanda, orégano, camomila, capim-limão, boldo) |

As faixas da noite ainda são **estimativas**, marcadas assim na `fonte`, até alguém revisar espécie por espécie:

- `temperaturaNoturna`: a faixa do dia 5 °C abaixo. As extensões universitárias recomendam noites de 3 a 8 °C
  mais frias, e os valores publicados para tomate, pimentão e alface caem dentro da faixa calculada.
- `umidadeDoArNoturna`: o mínimo do dia e o máximo 10 pontos acima, até 95%, porque a umidade relativa sobe
  quando o ar esfria.

## Faixas e plantas já cadastradas

No cadastro, a planta guarda uma **cópia** das faixas da espécie, e o status dela é calculado com essa cópia.
Por isso, mudar uma faixa aqui só vale para plantas cadastradas depois; as que já existem continuam com as
faixas da época do cadastro.

O catálogo embutido sempre tem as seis faixas, porque a validação exige. Por enquanto a planta copia só a umidade,
a temperatura e a luminosidade do dia; a luz diária e as faixas da noite chegam às plantas com a #90. Ainda assim, o domínio aceita uma
espécie sem faixas (`faixasIdeais: null`): o cadastro acontece normalmente e a planta fica sem faixas, aparecendo
como "sem dados".

## Sobre os valores atuais

As faixas da primeira versão são valores de referência para cultivo doméstico, compilados a partir das fontes
citadas em cada faixa. Ao revisar uma espécie, confira o valor na fonte e, se ele mudar, atualize também a
`fonte` com a publicação exata.

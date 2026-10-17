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
    "luminosidade": { "minimo": 20000, "maximo": 80000, "fonte": "..." }
  },
  "intervaloDeRegaEmDias": 3,
  "nivelDeDificuldade": "facil",
  "cicloAteColheitaEmDias": { "minimo": 120, "maximo": 150 }
}
```

| Campo | Obrigatório | Regra |
| --- | --- | --- |
| `id` | sim | Único no catálogo, em kebab-case e sem acento (`capim-limao`). **Nunca mude o id de uma espécie que já existe**: as plantas cadastradas guardam esse id. |
| `nomeComum` | sim | Nome popular mostrado no app. |
| `nomeCientifico` | sim | Nome científico. Para grupos, use o gênero ou a família (`Phalaenopsis`, `Cactaceae`). |
| `nomesAlternativos` | sim | Outros nomes populares, usados na busca. Pode ser `[]`. |
| `foto` | sim | Caminho de uma imagem em `assets/`, ou `null` enquanto a espécie não tiver foto. |
| `faixasIdeais` | sim | As três faixas: `umidadeDoAr` em %, `temperatura` em °C e `luminosidade` em lux. |
| `faixasIdeais.*.minimo` / `maximo` | sim | Números, com `minimo` **menor** que `maximo`. Umidade entre 0 e 100, temperatura entre -10 e 50, luz entre 0 e 120000. |
| `faixasIdeais.*.fonte` | sim | De onde veio a faixa (instituição e publicação). |
| `intervaloDeRegaEmDias` | sim | Inteiro positivo: de quantos em quantos dias regar em condições normais. |
| `nivelDeDificuldade` | sim | `facil`, `medio` ou `dificil`. |
| `cicloAteColheitaEmDias` | sim | Dias do plantio à primeira colheita (`minimo` ≤ `maximo`), ou `null` para quem não se colhe. |

O tipo correspondente no domínio é `EspecieVegetal`, em `src/dominio/modelos/EspecieVegetal.ts`.

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

## Sobre os valores atuais

As faixas da primeira versão são valores de referência para cultivo doméstico, compilados a partir das fontes
citadas em cada faixa. Ao revisar uma espécie, confira o valor na fonte e, se ele mudar, atualize também a
`fonte` com a publicação exata.

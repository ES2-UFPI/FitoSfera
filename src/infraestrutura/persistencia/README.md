# Armazenamento local

O app guarda os dados da pessoa no AsyncStorage do aparelho, sem banco relacional. Por isso o formato gravado
é um contrato: mudar o modelo sem migrar os dados apagaria o jardim de quem já instalou o app.

## Mapa de chaves

Todas as chaves ficam em [`chaves.ts`](chaves.ts); nenhum outro arquivo escreve o nome de uma chave.

| Chave | Conteúdo | Quem usa |
| --- | --- | --- |
| `fitosfera:versao-do-schema` | Número inteiro, em texto, da versão em que os dados estão (`"2"`). | `MigradorDoArmazenamento` |
| `fitosfera:v2:plantas` | Array JSON de `RegistroDePlanta`, na ordem de cadastro. | `RepositorioDePlantasAsyncStorage` |
| `fitosfera:v2:plantas:ilegivel` | Cópia do conteúdo de `fitosfera:v2:plantas` que não era um array JSON, guardada antes de ser sobrescrito. | `RepositorioDePlantasAsyncStorage` |

Chaves reservadas para as próximas histórias, ainda sem código:

| Chave | Conteúdo previsto |
| --- | --- |
| `fitosfera:v2:regas` | Histórico de regas por planta (US08). |
| `fitosfera:v2:preferencias` | Preferências da pessoa, como notificações. |

Chaves de versões anteriores, que só a migração lê. Elas não são apagadas depois da migração e ficam como cópia
de segurança:

| Versão | Chaves |
| --- | --- |
| 0 | `@fitosfera/plantas`, `@fitosfera/plantas:ilegivel` |
| 1 | `fitosfera:v1:plantas`, `fitosfera:v1:plantas:ilegivel` |

### Formato de uma planta (`RegistroDePlanta`)

```json
{
  "id": "k3f9a2",
  "idEspecie": "tomate",
  "apelido": "Tomatinho",
  "aparencia": { "forma": "frutifera", "folhagem": "verde-folha", "destaque": "vermelho", "vaso": "terracota" },
  "cadastradaEm": "2026-10-17T14:00:00.000Z",
  "faixasRecomendadas": {
    "umidadeDoAr": { "minimo": 50, "maximo": 70 },
    "temperatura": { "minimo": 20, "maximo": 28 },
    "luminosidade": { "minimo": 25000, "maximo": 80000 }
  }
}
```

`cadastradaEm` é a data e hora do cadastro em ISO 8601. Registros gravados antes de esse campo existir, ou com
uma data ilegível, continuam válidos e são lidos com data desconhecida (`null`); por isso o campo novo não
exigiu uma nova versão do schema.

`faixasRecomendadas` é uma cópia das faixas da espécie, feita no cadastro (umidade do ar em %, temperatura em
°C e luminosidade em lux, sem a fonte). O status da planta é calculado com essa cópia, então revisar o catálogo
depois não muda plantas já cadastradas. Fica `null` quando a espécie não tinha faixa: o cadastro acontece
normalmente e a planta aparece como "sem dados". Faixas malformadas também são lidas como `null`, sem perder a
planta.

A conversão entre o modelo `Planta` do domínio e esse JSON fica em [`MapeadorDePlanta.ts`](MapeadorDePlanta.ts).
O domínio não conhece o formato gravado.

## Versão do schema e migração

- A versão atual é `VERSAO_ATUAL_DO_ARMAZENAMENTO`, em `chaves.ts`.
- Na abertura do app, antes da primeira leitura, `ArmazenamentoComMigracao` chama o
  `MigradorDoArmazenamento`. Ele lê a versão gravada e aplica, em ordem, as migrações de `migracoes.ts` que
  faltam, gravando a versão a cada passo.
- Sem versão gravada, os dados são tratados como versão 0. Uma versão ilegível também vira 0.
- Dados de uma versão mais nova que a do app, por exemplo depois de um downgrade, ficam como estão.

| Migração | O que faz |
| --- | --- |
| 0 → 1 | Move as plantas de `@fitosfera/plantas` para `fitosfera:v1:plantas`, com os registros intactos. |
| 1 → 2 | Move as plantas para `fitosfera:v2:plantas` e dá a cada uma, se ainda não tiver, uma cópia das faixas que a espécie tem no catálogo naquele momento (`null` se a espécie saiu do catálogo). |

### Como mudar o formato

1. Mova as chaves atuais de `CHAVES` para um `CHAVES_DA_VERSAO_<n>`, crie em `CHAVES` as chaves
   `fitosfera:v<n+1>:...` e aumente `VERSAO_ATUAL_DO_ARMAZENAMENTO`.
2. Escreva em `migracoes.ts` uma `Migracao` com `paraVersao: <n+1>`, que leia o formato antigo e grave o novo,
   e acrescente essa migração a `MIGRACOES`. As migrações antigas continuam gravando nas chaves da sua versão.
3. A migração precisa poder rodar de novo sem estrago, porque o app pode fechar no meio dela.
4. Não apague as chaves antigas na mesma versão em que os dados mudam de lugar.
5. Cubra a migração em `testes/unidade/MigradorDoArmazenamento.test.ts`, com dados no formato antigo.

O `MigradorDoArmazenamento` recusa uma lista de migrações com buraco (por exemplo, 1 e 3 sem a 2).

## Dado corrompido ou ilegível

O app abre mesmo com dados ruins:

- **Chave que não é JSON ou não é uma lista:** a leitura devolve um jardim vazio. Na próxima gravação, o
  conteúdo original é copiado para a chave `:ilegivel` antes de ser sobrescrito.
- **Um registro inválido dentro da lista:** só ele fica de fora da listagem. Ele continua gravado, e as
  próximas gravações o preservam como estava.
- **Falha na migração:** o aviso vai para o console, o app segue com o que já estiver no formato atual e a
  migração é tentada de novo na próxima abertura, porque a versão gravada não avançou.

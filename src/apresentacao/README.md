# Apresentação

Telas e componentes do app. A apresentação fala com os casos de uso pelo container do `ContextoDoAplicativo` e
nunca importa `infraestrutura/`; os textos ficam em [`src/textos`](../textos/index.ts).

## Padrão de interface (US07, #40)

### Tokens: um módulo só

Toda cor, tipografia e medida sai de [`tema`](tema/index.ts), importado sempre do módulo inteiro:

```ts
import { CORES, ESPACO, RAIO, TEXTO } from '../tema';
```

| Token | O que tem |
| --- | --- |
| `CORES` | A paleta "Estante ao sol": fundos, textos, madeira, papel, ações, status e o véu dos modais. |
| `TEXTO`, `FONTES` | Os estilos de texto (`titulo`, `subtitulo`, `corpo`, `apoio`, `rotulo`, `botao`) e as famílias. |
| `ESPACO` | `fino` 2 · `minimo` 4 · `curto` 6 · `pequeno` 8 · `medio` 12 · `grande` 16 · `amplo` 20 · `folgado` 24. Os três primeiros são os ajustes finos, dentro de um mesmo bloco. |
| `RAIO` | `fino` 4 · `pequeno` 6 · `medio` 14 · `grande` 22 · `pilula`. |
| `LARGURA_DO_CONTEUDO`, `LARGURA_DO_MODAL`, `LARGURA_DA_LEITURA` | Até onde crescem o conteúdo (520), um modal (440) e uma frase centralizada (300). |
| `ALVO_DE_TOQUE`, `ALVO_DE_TOQUE_MINIMO` | A altura de botões e linhas (48) e o menor alvo aceito (44). |

Nenhuma tela escreve cor (`'#FFF'`, `rgba(…)`) ou espaçamento (`gap: 6`, `ESPACO.medio + 2`) com valor literal. Um
valor que não existe na escala pede um token novo aqui, não um número na tela. A exceção são os desenhos das plantas,
com a paleta própria em [`ilustracao/paletas.ts`](ilustracao/paletas.ts), e a geometria dos desenhos (posições como
`top: largura * 0.96`), que não é espaçamento.

O teste [`tokensDaInterface.test.ts`](../../testes/unidade/tokensDaInterface.test.ts) reprova o pull request que
trouxer uma cor ou um espaçamento literal, ou que importar de `tema/cores` em vez de `tema`.

### Componentes base

| Componente | Para quê |
| --- | --- |
| [`BotaoPrincipal`](componentes/BotaoPrincipal.tsx) | Todo botão de texto, nas variantes da seção abaixo. |
| [`Cartao`](componentes/Cartao.tsx) | Todo cartão de conteúdo: superfície, borda fina, raio `medio`, espaço `grande` por dentro e `medio` entre os itens. `compacto` tira o espaço interno, para cartões com cabeçalho tocável. |
| [`SeloDeStatus`](componentes/SeloDeStatus.tsx) | O status da planta (ok, atenção, sem dados): ponto na cor e texto. `pilula` na tela da planta, `miudo` na etiqueta da estante. |
| [`MensagemDeVazio`](componentes/MensagemDeVazio.tsx) | O que ainda não existe e como começar. `tela` ocupa a tela (histórico sem regas); `cartao` fica dentro de um cartão (colheitas, pareamento sem sensor, comparação sem frutíferas). |

O estado vazio da estante, [`telas/EstadoVazio`](telas/EstadoVazio.tsx), é a versão ilustrada da `MensagemDeVazio`,
com os vasos tracejados.

## Uma ação principal por tela (US07, #39)

Cada tela tem **uma** ação em destaque: a que a pessoa provavelmente quer fazer ali. Ela usa um botão preenchido e
com sombra; todo o resto fica com contorno, para não disputar a atenção.

| Variante do `BotaoPrincipal` | Aparência | Quando usar |
| --- | --- | --- |
| `padrao` | Verde, preenchido, com sombra | A ação principal da tela. |
| `rega` | Azul, preenchido, com sombra | A ação principal quando ela é regar. |
| `perigo` | Vermelho, preenchido, com sombra | Só dentro da confirmação de algo que não se desfaz. |
| `secundaria` | Contorno verde | Qualquer outra ação. |
| `perigoDiscreto` | Contorno vermelho | Uma ação destrutiva fora da confirmação, como "Excluir" na tela da planta. |

`ehVariantePrincipal` diz quais variantes contam como ação principal. O botão flutuante "Nova planta" também é
uma ação principal.

### A ação principal de cada tela

| Tela | Ação principal |
| --- | --- |
| Jardim vazio | Começar |
| Jardim com plantas | Nova planta |
| Planta | Registrar rega. A colheita, nas frutíferas, fica secundária, e "Excluir" é discreto. |
| Confirmação de exclusão | Excluir planta |
| Cadastro e edição: aparência | Continuar |
| Cadastro e edição: apelido | Colocar na estante ou Salvar alterações |
| Ajustes sem sensor pareado | Parear sensor |
| Ajustes com sensor pareado, ou sem Bluetooth no aparelho | Mudar o horário dos lembretes |
| Pareamento, depois de uma falha | Tentar de novo (o atalho das configurações é secundário) |
| Pareamento, sem nenhum sensor achado | Procurar de novo |
| Pareamento concluído | Concluir |

As telas de consulta não têm botão em destaque, porque nelas a ação é o próprio controle: a busca de espécies (o
campo já abre focado), o horário dos lembretes (os botões − e + salvam sozinhos), o histórico de regas e a comparação
de rendimento (a escolha das plantas).

## Alvos de toque

Nada tocável fica abaixo de **44 × 44 pontos** (`ALVO_DE_TOQUE_MINIMO`), nem contando só a parte visível: o
`hitSlop` não conta, porque a pessoa mira no que vê. Botões e linhas usam `ALVO_DE_TOQUE` (48) de altura.

O teste [`acoesPrincipais.test.tsx`](../../testes/telas/acoesPrincipais.test.tsx) percorre as telas e reprova o pull
request se alguma tiver duas ações em destaque ou um alvo de toque declarado abaixo de 44 pontos. Uma tela nova entra
lá com a sua ação principal.

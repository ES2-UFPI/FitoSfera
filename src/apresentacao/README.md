# Apresentação

Telas e componentes do app. A apresentação fala com os casos de uso pelo container do `ContextoDoAplicativo` e
nunca importa `infraestrutura/`; os textos ficam em [`src/textos`](../textos/index.ts).

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

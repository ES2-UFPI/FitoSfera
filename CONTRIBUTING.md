# Como contribuir com o FitoSfera

Este guia define como o time cria branches, escreve commits e abre pull requests. O objetivo é que várias
pessoas trabalhem em paralelo sem conflito e que todo o histórico leve de volta a uma issue do backlog.

Antes de abrir um pull request, confira também a [Definition of Done](docs/definition-of-done.md).

## Branches

| Branch | Para que serve | Quem escreve nela |
| --- | --- | --- |
| `main` | Versão estável, apresentada na Sprint Review. | Só pull request vindo de `dev`. |
| `dev` | Integração do trabalho da sprint. | Só pull request vindo de uma branch de issue. |
| `nome#numero` | Uma issue em andamento. | A pessoa responsável pela issue. |

- Toda branch de trabalho nasce da `dev` atualizada:

  ```bash
  git checkout dev
  git pull
  git checkout -b "lucas#42"
  ```

- O nome é o primeiro nome de quem trabalha, em minúsculas, seguido de `#` e do número da issue, por exemplo
  `felipe#33` ou `lucas#42`. Quando uma branch resolve várias issues da mesma história, repita o `#`:
  `lucas#17#18`.
- Depois do merge, apague a branch no GitHub e na sua máquina.

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/), com a mensagem em português
e o número da issue no fim do título:

```
<tipo>(<escopo opcional>): <o que muda, no imperativo> (#<issue>)
```

| Tipo | Quando usar |
| --- | --- |
| `feat` | Comportamento novo para quem usa o app. |
| `fix` | Correção de um comportamento errado. |
| `test` | Só testes, sem mudar o comportamento. |
| `docs` | Só documentação (README, wiki copiada para o repositório, comentários). |
| `refactor` | Mudança de estrutura sem mudar o comportamento. |
| `chore` | Configuração, dependências, CI, scripts. |

## Pull requests

1. Rode localmente antes de abrir o pull request:

   ```bash
   npm run typecheck
   npm test
   ```

2. Abra o pull request **para a `dev`**. O destino `main` só é usado no fechamento da sprint, a partir da `dev`.
3. O título segue o mesmo padrão dos commits. A descrição usa o template do repositório, que traz a
   checklist da Definition of Done, e cita a issue com `Closes #<numero>` para ela fechar no merge.
4. O pull request precisa de **pelo menos uma aprovação** de outra pessoa do time e do **CI verde**.

## Regras de proteção no GitHub

As regras abaixo são configuradas por quem administra o repositório, em
**Settings → Branches → Add branch ruleset** (ou *Branch protection rules*), uma vez para `main` e outra para `dev`:

- **Require a pull request before merging**, com **Required approvals: 1**.
- **Require status checks to pass**, marcando o check **Verificação** do workflow
  [CI](.github/workflows/ci.yml).
- **Block force pushes** e **Restrict deletions**.
- Sem exceção para administradores: ninguém faz push direto em `main` ou `dev`.

## Rodando o projeto

```bash
npm ci
npm start          # Expo, para abrir no Android
npm run web        # prévia no navegador
npm test           # testes de unidade e de tela
npm run typecheck  # verificação de tipos do app e dos testes
```

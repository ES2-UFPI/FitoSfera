# composicao

`criarContainer.ts` — Composition Root: o único arquivo do projeto que importa classes
concretas de `infraestrutura/`. Instancia repositórios, adaptador de sensor, regras de cuidado e
casos de uso, devolvendo um `Container` (interface).

Nenhuma classe de domínio ou de aplicação usa `new` sobre uma implementação de infraestrutura.

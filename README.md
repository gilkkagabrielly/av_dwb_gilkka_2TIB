# API de Filmes — AV1 e AV2

Projeto desenvolvido para a disciplina de Desenvolvimento Web, utilizando Node.js e Express.

O projeto foi desenvolvido em duas etapas:

- **AV1:** desenvolvimento do CRUD de filmes.
- **AV2:** evolução da API com autenticação, segurança, upload de imagens e documentação com Swagger.

---

## AV1 — CRUD de Filmes

Na primeira etapa do projeto foi desenvolvida uma API para gerenciamento de filmes.

### Funcionalidades da AV1

- Listagem de filmes
- Cadastro de filmes
- Consulta de filme por ID
- Atualização de filmes
- Exclusão de filmes

### Rotas principais

```text
GET    /filmes
GET    /filmes/:id
POST   /filmes
PUT    /filmes/:id
DELETE /filmes/:id

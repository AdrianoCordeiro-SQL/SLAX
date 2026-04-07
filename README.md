# SLAX

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## Sobre o Projeto

O **SLAX** e um **Simulador de SaaS de observabilidade focado em operacoes de e-commerce**.

Ele combina uma API em FastAPI com um frontend em Next.js para centralizar indicadores operacionais como atividade de usuarios, volume de requests, receita, devolucoes e saude da operacao em dashboards e relatorios.

### Como a magica funciona (Core Feature)

Ao clicar em **Adicionar cliente** e marcar a opcao **Gerar atividade recente para este cliente**, o sistema cria automaticamente um historico sintetico de eventos (compras, devolucoes, comentarios e carrinho), incluindo metricas de receita.

Essa massa e gerada em janelas temporais realistas, distribuindo eventos de ate **365 dias atras ate hoje** para enriquecer instantaneamente o dashboard e os relatorios.

## Principais Funcionalidades

- **Dashboard de observabilidade** com KPIs de usuarios, requests, receita, devolucoes e variacoes semanais.
- **Sparklines de 7 dias** para usuarios, requests, receita e health.
- **Serie de performance (30 dias)** com volume de requests e latencia estimada.
- **Feed de atividade paginado** com logs recentes por conta.
- **Relatorios avancados** com filtros por periodo, status, acao, usuario e tipo de transacao.
- **Alertas operacionais** com regras configuraveis (ex.: taxa de devolucao, queda de receita, dias sem compra).
- **CRUD de clientes** com opcao de geracao automatica de atividade sintetica.
- **Autenticacao JWT** com isolamento por conta (multitenancy por `account_id`).

## Stack Tecnologica

### Frontend

- `Next.js 16` (App Router)
- `React 19` + `TypeScript`
- `Tailwind CSS 4`
- `shadcn/ui` + `Radix UI`
- `TanStack React Query`
- `Zustand`
- `React Hook Form` + `Zod`
- `Recharts`
- `Vitest` + `Testing Library`

### Backend

- `FastAPI`
- `SQLModel` + `SQLAlchemy`
- `Pydantic`
- `PyJWT`
- `passlib[bcrypt]`
- `pytest` + `freezegun`

### Banco de Dados

- `PostgreSQL 15` (padrao no Docker Compose)
- `psycopg2-binary` para conexao no backend

### Infraestrutura e Qualidade

- `Docker` + `Docker Compose`
- CI com GitHub Actions em [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
- Lint e qualidade:
  - Backend: `ruff`, `pyright`
  - Frontend: `eslint`, `typescript`

## Como Executar Localmente (Docker)

### 1) Clone o repositorio

```bash
git clone <URL_DO_REPOSITORIO>
cd SLAX
```

### 2) Configure as variaveis de ambiente

Crie um arquivo `.env` na raiz baseado no `.env.example`:

```bash
cp .env.example .env
```

No Windows (PowerShell), voce pode copiar manualmente o conteudo de `.env.example` para `.env`.

### 3) Suba os containers

```bash
docker compose up --build
```

Esse comando inicia:

- `db` (PostgreSQL) em `localhost:5432`
- `backend` (FastAPI) em `localhost:8000`
- `frontend` (Next.js) em `localhost:3000`

### 4) Acesse a aplicacao

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend (health): [http://localhost:8000](http://localhost:8000)
- Docs da API: [http://localhost:8000/docs](http://localhost:8000/docs)

### 5) (Opcional) Garantir conta admin manualmente

Se precisar recriar conta administrativa no backend:

```bash
docker compose exec backend python -m app.seed
```

## Acesso ao Sistema

> **Acesso de demonstracao**
>
> - **Login:** `admin@email.com`
> - **Senha:** `admin123`

## Variaveis de Ambiente

### Raiz (`.env`)

Base: [`.env.example`](.env.example)

- `DATABASE_URL`: URL de conexao do backend com Postgres.
- `POSTGRES_USER`: usuario do banco.
- `POSTGRES_PASSWORD`: senha do banco.
- `POSTGRES_DB`: nome do banco.
- `JWT_SECRET`: segredo para assinatura de tokens JWT.
- `ALLOWED_ORIGINS`: origens permitidas no CORS (separadas por virgula).
- `SEED_ADMIN_EMAIL`: email da conta admin inicial.
- `SEED_ADMIN_PASSWORD`: senha da conta admin inicial.

### Frontend (`frontend/.env`)

Base: [`frontend/.env.example`](frontend/.env.example)

- `NEXT_PUBLIC_API_URL`: URL publica da API consumida pelo frontend.

## Estrutura do Projeto

```text
SLAX/
|-- backend/
|   |-- app/
|   |   |-- routers/
|   |   |-- services/
|   |   |-- models.py
|   |   |-- schemas.py
|   |   `-- main.py
|   |-- tests/
|   |-- requirements.txt
|   `-- Dockerfile
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- hooks/
|   |-- lib/
|   |-- providers/
|   |-- package.json
|   |-- Dockerfile
|   `-- Dockerfile.prod
|-- .github/
|   `-- workflows/
|       `-- ci.yml
|-- docker-compose.yml
|-- docker-compose.prod.yml
|-- .env.example
`-- README.md
```

## CI e Qualidade

O workflow de CI executa pipeline para backend e frontend em push/PR:

- **Backend:** instalacao de dependencias, `ruff check` e `pytest`.
- **Frontend:** `npm ci`, `npm run lint`, `npm run test:run` e `npm run build`.

Arquivo de referencia: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

---

# SLAX (English Version)

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

## About the Project

**SLAX** is a **SaaS observability simulator focused on e-commerce operations**.

It combines a FastAPI backend with a Next.js frontend to centralize operational indicators such as user activity, request volume, revenue, returns, and platform health into dashboards and reports.

### How the magic works (Core Feature)

When you click **Add client** and enable **Generate recent activity for this client**, the platform automatically creates a synthetic event history (purchases, returns, comments, and cart actions), including revenue metrics.

This data is generated with realistic timestamps, spanning from up to **365 days ago through today**, so dashboards and reports become meaningful right away.

## Key Features

- **Observability dashboard** with KPIs for users, requests, revenue, returns, and weekly deltas.
- **7-day sparklines** for users, requests, revenue, and health.
- **30-day performance series** with request volume and estimated latency.
- **Paginated activity feed** with account-scoped logs.
- **Advanced reports** with filters by date range, status, action, user, and transaction kind.
- **Operational alerts** with configurable rules (e.g., return rate, revenue drop, days without purchase).
- **Client CRUD** with optional synthetic activity generation.
- **JWT authentication** with account-based multitenancy (`account_id`).

## Tech Stack

### Frontend

- `Next.js 16` (App Router)
- `React 19` + `TypeScript`
- `Tailwind CSS 4`
- `shadcn/ui` + `Radix UI`
- `TanStack React Query`
- `Zustand`
- `React Hook Form` + `Zod`
- `Recharts`
- `Vitest` + `Testing Library`

### Backend

- `FastAPI`
- `SQLModel` + `SQLAlchemy`
- `Pydantic`
- `PyJWT`
- `passlib[bcrypt]`
- `pytest` + `freezegun`

### Database

- `PostgreSQL 15` (default in Docker Compose)
- `psycopg2-binary` for backend connection

### Infrastructure and Quality

- `Docker` + `Docker Compose`
- GitHub Actions CI in [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
- Lint and quality tools:
  - Backend: `ruff`, `pyright`
  - Frontend: `eslint`, `typescript`

## Run Locally (Docker)

### 1) Clone the repository

```bash
git clone <REPOSITORY_URL>
cd SLAX
```

### 2) Configure environment variables

Create a root `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

On Windows (PowerShell), you can copy the `.env.example` content into `.env` manually.

### 3) Start containers

```bash
docker compose up --build
```

This command starts:

- `db` (PostgreSQL) at `localhost:5432`
- `backend` (FastAPI) at `localhost:8000`
- `frontend` (Next.js) at `localhost:3000`

### 4) Access the app

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend (health): [http://localhost:8000](http://localhost:8000)
- API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 5) (Optional) Ensure admin account manually

If needed, recreate the admin account from the backend container:

```bash
docker compose exec backend python -m app.seed
```

## Demo Access

> **Demo credentials**
>
> - **Login:** `admin@email.com`
> - **Password:** `admin123`

These credentials are already aligned with the project's default seed (`SEED_ADMIN_EMAIL=admin@email.com`).

## Environment Variables

### Root (`.env`)

Base file: [`.env.example`](.env.example)

- `DATABASE_URL`: backend connection string for Postgres.
- `POSTGRES_USER`: database user.
- `POSTGRES_PASSWORD`: database password.
- `POSTGRES_DB`: database name.
- `JWT_SECRET`: secret used to sign JWT tokens.
- `ALLOWED_ORIGINS`: allowed CORS origins (comma-separated).
- `SEED_ADMIN_EMAIL`: initial admin account email.
- `SEED_ADMIN_PASSWORD`: initial admin account password.

### Frontend (`frontend/.env`)

Base file: [`frontend/.env.example`](frontend/.env.example)

- `NEXT_PUBLIC_API_URL`: public backend URL consumed by the frontend.

## Project Structure

```text
SLAX/
|-- backend/
|   |-- app/
|   |   |-- routers/
|   |   |-- services/
|   |   |-- models.py
|   |   |-- schemas.py
|   |   `-- main.py
|   |-- tests/
|   |-- requirements.txt
|   `-- Dockerfile
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- hooks/
|   |-- lib/
|   |-- providers/
|   |-- package.json
|   |-- Dockerfile
|   `-- Dockerfile.prod
|-- .github/
|   `-- workflows/
|       `-- ci.yml
|-- docker-compose.yml
|-- docker-compose.prod.yml
|-- .env.example
`-- README.md
```

## CI and Quality

The CI workflow runs backend and frontend pipelines on push/PR:

- **Backend:** dependency installation, `ruff check`, and `pytest`.
- **Frontend:** `npm ci`, `npm run lint`, `npm run test:run`, and `npm run build`.

Reference file: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
